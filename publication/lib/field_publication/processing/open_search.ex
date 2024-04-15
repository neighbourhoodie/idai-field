defmodule FieldPublication.Processing.OpenSearch do
  alias Phoenix.PubSub

  alias FieldPublication.CouchService
  alias FieldPublication.DataServices.OpensearchService
  alias FieldPublication.Publications
  alias FieldPublication.Schemas.Publication

  def evaluate_state(%Publication{} = publication) do
    publication_id = Publications.get_doc_id(publication)

    doc_count =
      CouchService.get_database(publication.database)
      |> then(fn {:ok, %{status: 200, body: body}} ->
        count =
          Jason.decode!(body)
          |> Map.get("doc_count", 0)

        # We do not count documents 'project' or 'configuration'.
        if count >= 2, do: count - 2, else: 0
      end)

    case OpensearchService.get_active_index(publication_id) do
      :none ->
        %{counter: 0, percentage: 0, overall: doc_count}

      index_name ->
        counter = OpensearchService.get_doc_count(index_name)

        %{
          counter: counter,
          percentage: counter / doc_count * 100,
          overall: doc_count
        }
    end
  end

  def index(%Publication{} = publication) do
    publication_id = Publications.get_doc_id(publication)

    OpensearchService.initialize_indices_for_alias(publication_id)
    OpensearchService.clear_inactive_index(publication_id)

    {:ok, counter_pid} =
      Agent.start_link(fn ->
        publication
        |> evaluate_state()
        # We will re-index in a moment, so set the state for counter and percentage accordingly
        |> Map.put(:counter, 0)
        |> Map.put(:percentage, 0)
      end)

    publication
    |> Publications.Data.get_doc_stream_for_all()
    |> Stream.reject(fn %{"_id" => id} ->
      id in ["project", "configuration"]
    end)
    |> Stream.reject(fn doc ->
      # Reject all documents marked as deleted
      Map.get(doc, "deleted", false)
    end)
    |> Stream.map(fn doc ->
      doc
      |> Map.put("id", doc["_id"])
      |> Map.delete("_id")
    end)
    |> Task.async_stream(
      fn doc ->
        OpensearchService.put(publication_id, doc)

        updated_state =
          Agent.get_and_update(counter_pid, fn %{counter: counter, overall: overall} = state ->
            state =
              state
              |> Map.put(:counter, counter + 1)
              |> Map.put(:percentage, (counter + 1) / overall * 100)

            {state, state}
          end)

        PubSub.broadcast(
          FieldPublication.PubSub,
          publication_id,
          {
            :search_index_processing_count,
            updated_state
          }
        )
      end,
      timeout: 1000 * 10
    )
    |> Enum.to_list()

    OpensearchService.switch_active_index(publication_id)
    OpensearchService.clear_inactive_index(publication_id)
  end
end
