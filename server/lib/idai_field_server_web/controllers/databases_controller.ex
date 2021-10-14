defmodule IdaiFieldServerWeb.DatabasesController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.CouchdbDatastore

  def index conn, _params do
    databases = CouchdbDatastore.list_databases()
    render(conn, "index.html", error_message: nil, databases: databases)
  end

  def new conn, _params do
    render(conn, "new.html", error_message: nil)
  end

  def create conn, %{ "database" =>
      %{
        "database_name" => name,
        "main_db_user_password" => password,
        "main_db_user_password_confirmation" => password_confirmation
      }} do

    if password != password_confirmation do
      conn = conn |> put_flash(:error, "passwords do not match")
      render conn, "new.html"
    else

      # TODO create new database and main db user for that database

      conn
      |> put_flash(:info, "Database created successfully.")
      |> redirect(to: Routes.databases_path(conn, :index))
    end
  end

  def edit conn, %{ "name" => name } = _params do
    render(conn, "edit.html", error_message: nil, name: name)
  end
end
