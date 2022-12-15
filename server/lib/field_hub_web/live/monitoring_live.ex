defmodule FieldHubWeb.MonitoringLive do
  alias FieldHub.Monitoring
  alias FieldHub.CouchService
  use Phoenix.LiveView

  def mount(%{"project" => project}, %{"user" => user, "password" => password}, socket) do

    credentials =
      %CouchService.Credentials{
        name: user,
        password: password
      }

    stats =
      credentials
      |> Monitoring.detailed_statistics(project)

   Process.send_after(self(), :update, 10000)

    {
      :ok,
      socket
      |> assign(:stats, stats)
      |> assign(:project, project)
      |> assign(:credentials, credentials)
    }
  end

  def handle_info(:update, %{assigns: %{credentials: credentials, project: project}} = socket) do

    stats =
      credentials
      |> Monitoring.detailed_statistics(project)

    Process.send_after(self(), :update, 10000)

    {:noreply, assign(socket, :stats, stats)}
  end

  def get_file_label(key) do
    case key do
      :original_image ->
        "original images"
      :thumbnail_image ->
        "thumbnail images"
    end
  end

end
