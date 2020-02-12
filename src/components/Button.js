// @flow
import React from 'react';
import { View, Text } from 'react-native';

import styles from './style';

type Props = {
    wrapperStyle: Object | number | Array,
    style: Object | number | Array,
    rest: Object | number | Array,
};

const Button = ({ wrapperStyle, style, ...rest }: Props) => (
    <View style={[styles.button, wrapperStyle, { backgroundColor: '#009DDF', borderRadius: 10, alignSelf: 'stretch', flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.buttonText, style, { color: '#FFFFFF', fontSize: 20}]} {...rest} />
    </View>
);

export default Button;
