import { DrawerNavigationProp } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Document } from 'idai-field-core';
import RootDrawerParamList from 'mobile/src/navigation/root-drawer-param-list';
import { View } from 'native-base';
import React, { ReactElement, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import DocumentDetails from '../components/DocumentDetails';
import Map from '../components/Map/Map';
import SearchBar from '../components/SearchBar';
import useSync from '../hooks/use-sync';
import { DocumentRepository } from '../repositories/document-repository';


export type HomeStackParamList = {
    Map: undefined;
    DocumentDetails: { docId: string }
};


const Stack = createStackNavigator<HomeStackParamList>();


interface HomeScreenProps {
    repository: DocumentRepository;
    documents: Document[];
    issueSearch: (q: string) => void;
    navigation: DrawerNavigationProp<RootDrawerParamList, 'Home'>;
    selectedDocument?: Document;
}


const HomeScreen: React.FC<HomeScreenProps> = ({
    repository,
    navigation,
    documents,
    issueSearch
}): ReactElement => {

    const [syncSettings, setSyncSettings, syncStatus] = useSync(repository);

    const toggleDrawer = useCallback(() => navigation.toggleDrawer(), [navigation]);

    return (
        <View flex={ 1 } safeArea>
            <SearchBar { ...{ issueSearch, syncSettings, setSyncSettings, syncStatus, toggleDrawer } } />
            <View style={ styles.container }>
                <Stack.Navigator initialRouteName="Map" screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="Map">
                        { (props) => <Map { ...props }
                            geoDocuments={ documents.filter(doc => doc?.resource.geometry) } /> }
                    </Stack.Screen>
                    <Stack.Screen name="DocumentDetails">
                        { (props) => <DocumentDetails { ...props }
                            docId={ props.route.params.docId }
                            repository={ repository } /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        backgroundColor: 'white',
    }
});


export default HomeScreen;
