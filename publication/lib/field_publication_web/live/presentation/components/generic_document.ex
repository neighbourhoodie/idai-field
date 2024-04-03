defmodule FieldPublicationWeb.Presentation.Components.GenericDocument do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    GenericField,
    DocumentLink
  }

  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.CoreComponents
  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <%= Data.get_field_values(@doc, "identifier") %>
      </.document_heading>

      <div class="flex flex-row">
        <div class="basis-2/3 m-5">
          <%= for group <- @doc["groups"] do %>
            <section>
              <.group_heading>
                <I18n.text values={group["labels"]} />
              </.group_heading>

              <dl class="grid grid-cols-4 gap-1 mt-2">
                <%= for field <- group["fields"] |> Enum.reject(fn(%{"key" => key}) -> key in ["identifier", "category"] end)  do %>
                  <div class="border-2 p-0.5">
                    <GenericField.render
                      values={field["values"]}
                      labels={field["labels"]}
                      lang={@lang}
                      type={field["type"]}
                    />
                  </div>
                <% end %>
              </dl>
            </section>
          <% end %>
        </div>
        <div class="basis-1/3">
          <% depicted_in = Data.get_relation_by_name(@doc, "isDepictedIn") %>
          <%= if depicted_in do %>
            <.group_heading>
              <I18n.text values={depicted_in["labels"]} />
            </.group_heading>
            <div class="grid grid-cols-3 gap-1 mt-2">
              <%= for uuid <- depicted_in["values"] do %>
                <.link patch={"/#{@project_name}/#{@publication_date}/#{@lang}/#{uuid}"} class="p-1">
                  <Image.show size="300," project={@project_name} uuid={uuid} />
                </.link>
              <% end %>
            </div>
          <% end %>
          <%= for other_relation <- @doc["relations"]
                  |> Enum.reject(fn %{"key" => key} -> key in ["isDepictedIn"] end)  do %>
            <.group_heading>
              <I18n.text values={other_relation["labels"]} />
            </.group_heading>
            <div class="grid grid-cols-3 gap-1 mt-2">
              <%= for uuid <- other_relation["values"] do %>
                <DocumentLink.show
                  project={@project_name}
                  date={@publication_date}
                  lang={@lang}
                  uuid={uuid}
                />
              <% end %>
            </div>
          <% end %>
          <.group_heading>
            Raw data
          </.group_heading>
          <a
            class="mb-1"
            target="_blank"
            href={~p"/api/raw/csv/#{@project_name}/#{@publication_date}/#{@uuid}"}
          >
            <.icon name="hero-table-cells-solid" /> Download CSV
          </a>
          <br />
          <a
            class="mb-1"
            target="_blank"
            href={~p"/api/raw/json/#{@project_name}/#{@publication_date}/#{@uuid}"}
          >
            <span class="text-center inline-block w-[20px]" style="block">{}</span> Download JSON
          </a>
        </div>
      </div>
    </div>
    """
  end
end
