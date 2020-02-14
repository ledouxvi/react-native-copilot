// @flow
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import Button from './Button';

import styles from './style';

import type { Step } from '../types';

type Props = {
  isFirstStep: boolean,
  isLastStep: boolean,
  handleNext: func,
  handlePrev: func,
  handleStop: func,
  currentStep: Step,
  labels: Object,
};

const Tooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
  labels,
	buttonToTop,
}: Props) => (
  <View style={{ maxWidth: 493 }}>
	  {buttonToTop
	  ? (
			  <View style={[styles.topBar]}>
				  <TouchableOpacity onPress={handleStop} style={{ alignSelf: 'stretch', flex: 1 }}>
					  <Button>{currentStep.target.props.labelButton || 'Finish'}</Button>
				  </TouchableOpacity>
				  {/**/}
			  </View>
		  )
	  :null}
    <View style={[styles.tooltipContainer, {
        paddingTop: 15,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 0,
    }]}>
      <Text testID="stepDescription" style={styles.tooltipText}>{currentStep.text}</Text>
    </View>
		{!buttonToTop
			? (
				<View style={[styles.bottomBar]}>
					<TouchableOpacity onPress={handleStop} style={{ alignSelf: 'stretch', flex: 1 }}>
						<Button>{currentStep.target.props.labelButton || 'Finish'}</Button>
					</TouchableOpacity>
					{/**/}
				</View>
			)
			:null}
      {/*
        !isLastStep ?
          <TouchableOpacity onPress={handleStop}>
            <Button>{labels.skip || 'Skip'}</Button>
          </TouchableOpacity>
          : null
      }
      {
        !isFirstStep ?
          <TouchableOpacity onPress={handlePrev}>
            <Button>{labels.previous || 'Previous'}</Button>
          </TouchableOpacity>
          : null
      }
      {
        !isLastStep ?
        <TouchableOpacity onPress={handleNext}>
            <Button>{labels.next || 'Next'}</Button>
        </TouchableOpacity> :*/}
  </View>
);

export default Tooltip;
