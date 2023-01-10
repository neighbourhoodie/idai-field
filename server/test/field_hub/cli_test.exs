defmodule FieldHub.CLITest do
  alias FieldHub.{
    CLI,
    Issues.Issue,
    TestHelper
  }

  import ExUnit.CaptureLog

  use ExUnit.Case

  @project_name "test_project"
  @extra_user "extra_user"
  @user_password "test_password"

  setup %{} do
    on_exit(fn ->
      TestHelper.remove_test_db_and_user(@project_name, @project_name)
      TestHelper.remove_user(@extra_user)
    end)
  end

  test "setup/1 works without error" do
    log =
      capture_log(fn ->
        assert :ok = CLI.setup()
      end)

    assert log =~ "Running initial CouchDB setup for single node"
    assert log =~ "Setup done."
  end

  test "create_project/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
      end)

    assert log =~ "CREATING PROJECT"
    assert log =~ "Project creation done."
  end

  test "create_project/1 twice should warn about its existence" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.create_project(@project_name)
      end)

    assert log =~ "CREATING PROJECT"
    assert log =~ "Project creation done."
    assert log =~ "[warning] Project database '#{@project_name}' already exists."
  end

  test "create_project/2 should log the requested password" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name, @user_password)
      end)

    assert log =~ "Created user '#{@project_name}' with password '#{@user_password}'."
  end

  test "delete_project/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.delete_project(@project_name)
      end)

    assert log =~ "[info] Deleted project database '#{@project_name}'."
    assert log =~ "[info] Deleted user '#{@project_name}'."
  end

  test "delete_project/1 on an unknown project should print warning" do
    log =
      capture_log(fn ->
        assert :ok = CLI.delete_project(@project_name)
      end)

    assert log =~ "[warning] Project database '#{@project_name}' does not exists."
  end

  test "create_user/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
      end)

    assert log =~ "Created user '#{@project_name}' with password"
  end

  test "create_user/1 twice should print warning" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.create_user(@project_name)
      end)

    assert log =~ "User '#{@project_name}' already exists."
  end

  test "create_user/2 should log the requested password" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name, @user_password)
      end)

    assert log =~ "Created user '#{@project_name}' with password '#{@user_password}'."
  end

  test "delete_user/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.delete_user(@project_name)
      end)

    assert log =~ "Deleted user '#{@project_name}'."
  end

  test "delete_user/1 on unknown user should print warning" do
    log =
      capture_log(fn ->
        assert :ok = CLI.delete_user(@project_name)
      end)

    assert log =~ "[warning] Unknown user '#{@project_name}'."
  end

  test "set_password/2" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.set_password(@project_name, @user_password)
      end)

    assert log =~ "[info] Updated password for user '#{@project_name}'."
  end

  test "set_password/2 on unknown user should print warning" do
    log =
      capture_log(fn ->
        assert :ok = CLI.set_password(@project_name, @user_password)
      end)

    assert log =~ "[warning] Unknown user '#{@project_name}'."
  end

  test "add_user_as_project_admin/2" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.create_user(@extra_user)
        assert :ok = CLI.add_user_as_project_admin(@extra_user, @project_name)
      end)

    assert log =~ "User '#{@extra_user}' has been set as admin to '#{@project_name}'."
  end

  test "add_user_as_project_admin/2 with unknown user should print warning" do
    unknown_user = "unknown_user"

    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.add_user_as_project_admin(unknown_user, @project_name)
      end)

    assert log =~
             "[warning] Tried to set unknown user '#{unknown_user}' to project '#{@project_name}'."
  end

  test "add_user_as_project_admin/2 with unknown project should print warning" do
    unknown_project = "unknown_project"

    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.add_user_as_project_admin(@project_name, unknown_project)
      end)

    assert log =~
             "[warning] Tried to set user '#{@project_name}' to unknown project '#{unknown_project}'."
  end

  test "add_user_as_project_member/2" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.add_user_as_project_member(@project_name, @project_name)
      end)

    assert log =~ "User '#{@project_name}' has been set as member to '#{@project_name}'."
  end

  test "add_user_as_project_member/2 with unknown user should print warning" do
    unknown_user = "unknown_user"

    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.add_user_as_project_member(unknown_user, @project_name)
      end)

    assert log =~
             "[warning] Tried to set unknown user '#{unknown_user}' to project '#{@project_name}'."
  end

  test "add_user_as_project_member/2 with unknown project should print warning" do
    unknown_project = "unknown_project"

    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.add_user_as_project_member(@project_name, unknown_project)
      end)

    assert log =~
             "[warning] Tried to set user '#{@project_name}' to unknown project '#{unknown_project}'."
  end

  test "remove_user_from_project/2" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.remove_user_from_project(@project_name, @project_name)
      end)

    assert log =~ "User '#{@project_name}' has been unset from all roles in '#{@project_name}'."
  end

  test "remove_user_from_project/2 with unknown user should print warning" do
    unknown_user = "unknown_user"

    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.remove_user_from_project(unknown_user, @project_name)
      end)

    assert log =~
             "[warning] Tried to unset unknown user '#{unknown_user}' from project '#{@project_name}'."
  end

  test "remove_user_from_project/2 with unknown project should print warning" do
    unknown_project = "unknown_project"

    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.remove_user_from_project(@project_name, unknown_project)
      end)

    assert log =~
             "[warning] Tried to unset user '#{@project_name}' from unknown project '#{unknown_project}'."
  end

  test "get_project_statistics/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.get_project_statistics(@project_name)
      end)

    # Testing for first and last line in statistics log
    assert log =~ "######### Project '#{@project_name}' #########"
    assert log =~ "##########################################"
  end

  test "get_project_issues/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.get_project_issues(@project_name)
      end)

    assert log =~ "Issue: no_project_document."
  end

  test "print_issues/1 with empty list logs that there are no issues" do
    log =
      capture_log(fn ->
        assert :ok = CLI.print_issues([])
      end)

    assert log =~ "[info] No issues found."
  end

  test "print_issues/1 issues of different serverity get logged accordingly" do
    issues = [
      %Issue{
        type: :error_level_issue,
        severity: :error,
        data: %{some_error_msg: "ABORT ABORT!"}
      },
      %Issue{
        type: :warning_level_issue,
        severity: :warning,
        data: %{some_warning_msg: "This was probably unintended."}
      },
      %Issue{
        type: :info_level_issue,
        severity: :info,
        data: %{some_info_msg: "Everything is fine, no need to worry."}
      }
    ]

    log =
      capture_log(fn ->
        assert :ok = CLI.print_issues(issues)
      end)

    assert log =~ "[error] Issue: error_level_issue:"
    assert log =~ "[error] - some_error_msg: ABORT ABORT!"
    assert log =~ "[warning] Issue: warning_level_issue:"
    assert log =~ "[warning] - some_warning_msg: This was probably unintended."
    assert log =~ "[info] Issue: info_level_issue:"
    assert log =~ "[info] - some_info_msg: Everything is fine, no need to worry."
  end
end