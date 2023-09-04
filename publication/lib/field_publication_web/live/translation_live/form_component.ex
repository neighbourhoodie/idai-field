defmodule FieldPublicationWeb.TranslationLive.FormComponent do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.inputs_for :let={translation} field={@form_field}>
        <div class="flex flex-row w-full">
          <span>
            <.input type="select" options={ISO639.iso639_1_codes()} field={translation[:language]} label="Language"/>
          </span>
          <span class="pl-2 w-96">
            <.input type="textarea" field={translation[:text]} label="Comment"/>
          </span>
          <span phx-click={@remove} phx-value-id={translation.id}>X</span>
        </div>
      </.inputs_for>
      <a phx-click={@add} type="button">Add comment</a>
    </div>
    """
  end
end
