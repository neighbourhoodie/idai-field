import React, { useRef } from 'react';
import { StyleSheet, Animated, PanResponder, View, ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { G } from 'react-native-svg';

interface SvgMapProps {
    style: ViewStyle;
    viewBox: [number, number, number, number]
}

const SvgMap: React.FC<SvgMapProps> = ( props ) => {

    const pan = useRef(new Animated.ValueXY()).current;
    const AG = Animated.createAnimatedComponent(G);
    const panResponder = useRef(
        PanResponder.create({
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            pan.setOffset({
              x: pan.x._value,
              y: pan.y._value
            });
          },
          onPanResponderMove: (event, gesture) => {
            pan.x.setValue(gesture.dx);
            pan.y.setValue(gesture.dy);
        },
        onPanResponderRelease: () => {
            pan.flattenOffset();
          }
        })
    ).current;


    return (
        <View style={ { ...styles.map, ...props.style } }>
            <ScrollView
                minimumZoomScale={ 1 } maximumZoomScale={ 5 } bounces={ false }
                disableScrollViewPanResponder={ true } contentContainerStyle={ styles.scrollViewStyle }>
                    <Animated.View style={ styles.animatedViewStyle } { ...panResponder.panHandlers }>
                        <Svg viewBox={ props.viewBox.join(' ') } style={ styles.svg } >
                            <AG x={ pan.x } y={ pan.y }>
                                {props.children}
                            </AG>
                        </Svg>
                    </Animated.View>
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    scrollViewStyle: {
        width: '100%',
        height: '100%'
    },
    animatedViewStyle: {
        width: '100%',
        height: '100%'
    },
    map: {
        borderColor: 'black',
        borderWidth: 1,
    },
    svg: {
        width: '100%',
        height: '100%',
    }
});


export default SvgMap;