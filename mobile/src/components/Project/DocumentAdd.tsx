import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Category, Document, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { DocumentRepository } from '../../repositories/document-repository';
import Button from '../common/Button';
import Heading from '../common/Heading';
import TitleBar from '../common/TitleBar';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';


type DocumentAddNav = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentAdd'>;

interface DocumentAddProps {
    config: ProjectConfiguration;
    repository: DocumentRepository;
    navigation: DocumentAddNav;
    parentDoc: Document;
    category: Category;
}

const DocumentAdd: React.FC<DocumentAddProps> = ({ config, repository, navigation ,parentDoc, category }) => {
    
    return (
        <SafeAreaView style={ styles.container }>
            <TitleBar
                title={
                    <Heading style={ styles.heading }>
                        Add {category.name} to { parentDoc.resource.identifier }
                    </Heading>
                }
                left={ <Button
                    variant="transparent"
                    onPress={ () => navigation.navigate('DocumentsMap',{}) }
                    icon={ <Ionicons name="chevron-back" size={ 18 } /> }
                /> }
            />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        padding: 10,
        flex: 1
    },
    heading: {
        marginLeft: 10,
    },
});

export default DocumentAdd;