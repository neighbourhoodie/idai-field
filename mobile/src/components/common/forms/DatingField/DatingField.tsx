import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Dating, DatingElement } from 'idai-field-core';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../../utils/colors';
import Row from '../../Row';
import { FieldBaseProps } from '../common-props';
import FieldLabel from '../FieldLabel';
import AfterForm from './AfterForm';
import BeforeForm from './BeforeForm';
import ExactForm from './ExactForm';
import PeriodForm from './PeriodForm';
import ScientificForm from './ScientificForm';


const DatingField: React.FC<FieldBaseProps> = ({ field, setFunction, currentValue }) => {

    const [showAddRow, setShowAddRow] = useState<boolean>(true);
    const [type, setType] = useState<Dating.Types>('range');
    const [begin, setBegin] = useState<DatingElement>();
    const [end, setEnd] = useState<DatingElement>();
    const [isImprecise, setIsImprecise] = useState<boolean>();
    const [isUncertain, setIsUncertain] = useState<boolean>();
    const [margin, setMargin] = useState<number>();
    const [source, setSource] = useState<string>('');

    const cancelHandler = () => setShowAddRow(true);

    const submitHandler = () => {
        const dating: Dating = {
            type,
            begin: begin ?
                begin :
                type === 'scientific' ? { year: 0, inputYear: 0, inputType: 'bce' } : undefined,
            end: end || undefined,
            isImprecise,
            isUncertain,
            source: source || undefined,
            margin
        };
        Object.keys(dating).forEach(key => dating[key] === undefined && delete dating[key]);
        Dating.addNormalizedValues(dating);
        setFunction(field.name,
            Array.isArray(currentValue) && currentValue.length ?
                (currentValue as Dating[]).push(dating) : [dating]);
        setShowAddRow(false);
        clearStates();
    };

    const pickerSelectHandler = (selectedType: Dating.Types) => {
        
        setType(selectedType);
        clearStates(false);
    };

    const clearStates = (clearType: boolean = true) => {

        if(clearType) setType('range');
        setBegin(undefined);
        setEnd(undefined);
        setIsImprecise(undefined);
        setIsUncertain(undefined);
        setMargin(undefined);
        setSource('');
    };


    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            { showAddRow ?
                <Row style={ styles.addDimension } testID="addRow">
                    <Text style={ { paddingRight: 2 } }>Add</Text>
                    <TouchableOpacity onPress={ () => setShowAddRow(false) } testID="addDating">
                        <MaterialCommunityIcons name="plus-circle" size={ 20 } color={ colors.success } />
                    </TouchableOpacity>
                </Row> :
                <View testID="datingForm">
                    <Picker
                        style={ styles.typePicker }
                        selectedValue={ type }
                        onValueChange={ (itemValue) => pickerSelectHandler(itemValue as Dating.Types) }
                        itemStyle={ styles.typePickerItem }
                        testID="typePicker">
                            {Dating.VALID_TYPES.map(type =>
                                <Picker.Item value={ type } label={ type } key={ type } />)}
                    </Picker>
                    {(type === 'range') &&
                        <PeriodForm
                            begin={ begin } setBegin={ setBegin }
                            end={ end } setEnd={ setEnd }
                            isImprecise={ isImprecise } setIsImprecise={ setIsImprecise }
                            isUncertian={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'exact') &&
                        <ExactForm
                            end={ end } setEnd={ setEnd }
                            isUncertain={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'before') &&
                        <BeforeForm
                            end={ end } setEnd={ setEnd }
                            isImprecise={ isImprecise } setIsImprecise={ setIsImprecise }
                            isUncertian={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'after') &&
                        <AfterForm
                            begin={ begin } setBegin={ setBegin }
                            isImprecise={ isImprecise } setIsImprecise={ setIsImprecise }
                            isUncertian={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'scientific') &&
                        <ScientificForm
                            end={ end } setEnd={ setEnd }
                            margin={ margin } setMargin={ setMargin }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                </View>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    addDimension: {
        marginTop: 3,
        padding: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    typePicker: {
        width: '100%',
        height: 100,
        marginLeft: 5,
        marginRight: '40%',
    },
    typePickerItem: {
        height: 100,
        fontSize: 18
    },
});

export default DatingField;