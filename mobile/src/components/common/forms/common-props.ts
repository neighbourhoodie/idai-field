import { Field } from 'idai-field-core';

export interface FieldBaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFunction: (key: string, value: any) => void;
    field: Field;
    currentValue?: string | number
}