defmodule Api.Worker.Enricher.I18NFieldConverter do

  alias Api.Core.CategoryTreeList
  alias Api.Worker.Enricher.Utils

  def convert_category change = %{ doc: %{ resource: resource } }, category_definition_groups do
    resource = Enum.reduce(resource, resource, convert_resource_field(category_definition_groups))
    put_in(change.doc.resource, resource)
  end

  def convert change, configuration do
    name = change.doc.resource.category.name # TODO review category.name, maybe document the expectation
    category_definition = CategoryTreeList.find_by_name(name, configuration)
    convert_category change, category_definition.groups
  end

  defp convert_string(resource, field_name, field_value) when not is_map(field_value) do  # this is from legacy project then
    put_in(resource, [field_name], %{ "unspecifiedLanguage" => field_value })
  end
  defp convert_string resource, _field_name, _field_value do
    resource
  end

  defp convert_string_array_item(item) when not is_map(item) do # legacy
    %{ "unspecifiedLanguage" => item }
  end
  defp convert_string_array_item item do
    item
  end

  defp convert_string_array(resource, field_name, field_value) do
    put_in(resource, [field_name], Enum.map(field_value, &convert_string_array_item/1))
  end

  defp convert_dating_source(dating_item_source) when not is_map(dating_item_source) do # from legacy project
    # TODO review, here we use keyword, above we use string
    %{ unspecifiedLanguage: dating_item_source }
  end
  defp convert_dating_source dating_item_source do
    dating_item_source
  end

  defp convert_dating_item dating_item do
    put_in(dating_item.source, convert_dating_source(dating_item.source))
  end

  defp convert_dating resource, field_name, field_value do
    put_in(resource, [field_name], Enum.map(field_value, &convert_dating_item/1))
  end

  defp convert_dimension_measurement_comment(dimension_measurement_comment) when not is_map(dimension_measurement_comment) do # legacy project
    %{ unspecifiedLanguage: dimension_measurement_comment }
  end
  defp convert_dimension_measurement_comment dimension_measurement_comment do
    dimension_measurement_comment
  end

  defp convert_dimension_item dimension_item do
    put_in(dimension_item.measurementComment, convert_dimension_measurement_comment(dimension_item.measurementComment))
  end

  defp convert_dimension resource, field_name, field_value do
    put_in(resource, [field_name], Enum.map(field_value, &convert_dimension_item/1))
  end

  defp convert_resource_field category_definition_groups do
    fn {field_name, field_value}, resource ->
      field_definition = Utils.get_field_definition category_definition_groups, Atom.to_string(field_name)

      if is_nil(field_definition[:inputType]) do
        resource
      else
        cond do
          field_definition.inputType == "dating" ->
            convert_dating resource, field_name, field_value

          field_definition.inputType == "dimension" ->
            convert_dimension resource, field_name, field_value

          field_definition.inputType == "multiInput"
            or field_definition.inputType == "simpleMultiInput" ->
              convert_string_array resource, field_name, field_value

          field_definition.inputType == "input"
              or field_definition.inputType == "simpleInput"
              or field_definition.inputType == "text" ->
            convert_string resource, field_name, field_value

          true ->
            resource
        end
      end
    end
  end
end