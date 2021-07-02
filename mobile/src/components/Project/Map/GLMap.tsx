import { FieldGeometry } from 'core/dist';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { GestureResponderEvent, StyleSheet } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { OrthographicCamera, Raycaster, Scene, Vector2 } from 'three';
import useToast from '../../../hooks/use-toast';
import { colors } from '../../../utils/colors';
import { ToastType } from '../../common/Toast/ToastProvider';
import { GeometryBoundings, setupTransformationMatrix, ViewPort } from './geo-svg';
import {
    lineStringToShape, multiPointToShape,
    multiPolygonToShape, pointToShape, polygonToShape
} from './geojson-gl-shape';

interface GLMapProps {
    geoBoundings: GeometryBoundings;
    viewPort: ViewPort;
    allDocs: Document[];
    config: ProjectConfiguration
    setHighlightedDocId: (docId: string) => void;
}


const GLMap: React.FC<GLMapProps> = (props) => {


    let timeout: number;
    const [camera, setCamera] = useState<OrthographicCamera>();
    const [scene, _setScene] = useState<Scene>(new Scene());
    const [transformMatrix, setTransformMatrix] = useState<Matrix4>();
    const { showToast } = useToast();

    useEffect(() => {
        
        if(props.viewPort){
            scene.clear();
            setCamera(new OrthographicCamera(
                props.viewPort.x,
                Math.max(props.viewPort.width, props.viewPort.height ),
                Math.max(props.viewPort.height,props.viewPort.width ),
                props.viewPort.y));
        }


    },[props.geoBoundings, props.viewPort, scene]);

    useEffect(() => {
        setTransformMatrix( setupTransformationMatrix(props.geoBoundings,props.viewPort));
    },[props.geoBoundings, props.viewPort]);
    

    useEffect(() => {
        
        if(!transformMatrix) return;
        props.allDocs.forEach((doc) => {
            
            const geometry = doc.resource.geometry as FieldGeometry;
            
            switch(geometry.type){
                case 'Polygon':
                    polygonToShape(transformMatrix, scene, props.config,doc, geometry.coordinates ,false);
                    break;
                case 'LineString':
                    lineStringToShape(transformMatrix, scene, props.config,doc, geometry.coordinates, true);
                    break;
                case 'MultiPolygon':
                    multiPolygonToShape(transformMatrix, scene, props.config, doc, geometry.coordinates, true);
                    break;
                case 'Point':
                    pointToShape(transformMatrix, scene, props.config, doc, geometry.coordinates, true);
                    break;
                case 'MultiPoint':
                    multiPointToShape(transformMatrix,scene, props.config, doc, geometry.coordinates, true);
                    break;
                default:
                    showToast(ToastType.Error, `Unknown geometry type ${geometry.type}`);
                    break ;
            }
        });
 

    },[props.allDocs, props.config ,scene, transformMatrix, showToast]);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => clearTimeout(timeout),[]);

    if (!camera || !props.allDocs.length) return null;

    const _onContextCreate = async(gl: ExpoWebGLRenderingContext) => {

        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        const sceneColor = colors.containerBackground;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);
        renderer.setClearColor(sceneColor);

        camera.position.set(0, 0, 5);
        // camera.zoom = 2;
        // camera.updateProjectionMatrix();

        const render = () => {
            timeout = requestAnimationFrame(render);
            //update();
            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        render();
    };

    const touchEvent = (e: GestureResponderEvent) => {

        const vec = new Vector2(
            (e.nativeEvent.locationX / props.viewPort.width ) * 2 - 1,
            -(e.nativeEvent.locationY / props.viewPort.height) * 2 + 1);
        const raycaster = new Raycaster();
        raycaster.setFromCamera(vec, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        if(intersects.length > 0){
            props.setHighlightedDocId(intersects[0].object.uuid);
        }
        
       
    };


    return (
        <GLView
            onTouchStart={ touchEvent }
            style={ styles.container }
            onContextCreate={ _onContextCreate }
        />
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
export default GLMap;