// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactNative from 'react-native';
import {
  Platform,
  StatusBar,
  View,
} from 'react-native';

import mitt from 'mitt';
import hoistStatics from 'hoist-non-react-statics';

import CopilotModal from '../components/CopilotModal';
import { OFFSET_WIDTH } from '../components/style';

import { getFirstStep, getLastStep, getStepNumber, getPrevStep, getNextStep } from '../utilities';

import type { Step, CopilotContext } from '../types';

/*
This is the maximum wait time for the steps to be registered before starting the tutorial
At 60fps means 2 seconds
*/
const MAX_START_TRIES = 120;

type State = {
  steps: { [string]: Step },
  currentStep: ?Step,
  visible: boolean,
  androidStatusBarVisible: boolean,
  backdropColor: string,
  flatList: React.RefObject,
  iosTopInset: number,
  iosBottomInset:number,
};

const copilot = ({
                   overlay,
                   tooltipComponent,
                   tooltipStyle,
                   stepNumberComponent,
                   animated,
                   labels,
                   androidStatusBarVisible,
                   totalSteps,
                   stopBetween,
                   backdropColor,
                   svgMaskPath,
                   verticalOffset = 0,
                   wrapperStyle,
                   labelLeave,
                 } = {}) =>
    (WrappedComponent) => {
      class Copilot extends Component<any, State> {
        state = {
          steps: {},
          currentStep: null,
          visible: false,
          flatList: null,
          iosTopInset: 0,
          iosBottomInset: 0,
        };

        getChildContext(): { _copilot: CopilotContext } {
          return {
            _copilot: {
              registerStep: this.registerStep,
              unregisterStep: this.unregisterStep,
              getCurrentStep: () => this.state.currentStep,
              isRegisterStep: this.isRegisterStep,
            },
          };
        }

        componentDidMount() {
          this.mounted = true;
        }

        componentWillUnmount() {
          this.mounted = false;
        }

        getStepNumber = (step: ?Step = this.state.currentStep): number =>
            getStepNumber(this.state.steps, step);

        getFirstStep = (): ?Step => getFirstStep(this.state.steps);

        getLastStep = (): ?Step => getLastStep(this.state.steps);

        getPrevStep = (step: ?Step = this.state.currentStep): ?Step =>
            getPrevStep(this.state.steps, step);

        getNextStep = (step: ?Step = this.state.currentStep): ?Step =>
            getNextStep(this.state.steps, step);

        setInsetBottom = (inset) =>
        {
          this.state.iosBottomInset = inset;
        }

        setInsetTop = (inset) =>
        {
          //console.warn('top inset', inset);
          this.state.iosTopInset = inset;
        }

        setCurrentStep = async (step: Step, move?: boolean = true): void => {
          await this.setState({ currentStep: step });
          this.eventEmitter.emit('stepChange', step);

          this.offset = undefined;
          //console.warn('setCurrentStep');
          if(this.state.flatList)
          {
            //console.warn('go Flatlist', this.state.layout);
            if(!this.state.layout)
            {
              if (this.maxRetry > MAX_START_TRIES) {
                this.maxRetry = 0;
                return;
              }
              this.maxRetry += 1;
              //console.warn('TRY RESOLVED LAYOUT');
              requestAnimationFrame(() => this.setCurrentStep(step, move));
              return;
            }

            const index = step.target.props.index;
            const initialOffset = step.target.props.initialOffset;
            const indexOffset = step.target.props.indexOffset ? step.target.props.indexOffset : 280;
            const indexSuggest = step.target.props.indexSuggest;
            const indexSuggestOffset = step.target.props.indexSuggestOffset ? step.target.props.indexSuggestOffset : 182;
            const totalHeight = step.target.props.countItem * indexOffset + indexSuggestOffset;
            this.offset = Math.max(0, /*96 +*/index * indexOffset);
            //console.warn('setCurrentStep index', index);
            //console.warn('setCurrentStep indexOffset', indexOffset);
            //console.warn('setCurrentStep indexSuggest', indexSuggest);
            //console.warn('setCurrentStep indexSuggestOffset', indexSuggestOffset);
            //console.warn('setCurrentStep countItem', step.target.props.countItem);
            //console.warn('setCurrentStep totalHeight', totalHeight);
            //console.warn('setCurrentStep this.offset', this.offset);
            if(indexSuggest < index)
            {
              this.offset += indexSuggestOffset;
              if(index > 0)
              {
                this.offset -= indexOffset;
              }
            }
            if(Platform.OS === 'ios')
            {
              this.offset -= initialOffset;
            }
            //console.warn('setCurrentStep this.offset last', this.offset);
            //console.warn('startMeasure', indexSuggest, index);
            //console.warn('layout', this.state.layout);

            /* console.warn(offset);
			 if (!this.props.androidStatusBarVisible && Platform.OS === 'android') {
			   offset -= StatusBar.currentHeight; // eslint-disable-line no-param-reassign
			 }*/
            this.state.flatList.scrollToOffset({ offset: this.offset, animated: false });

            if(totalHeight - this.offset < this.state.layout.height)
            {
              this.offset = totalHeight - this.offset;
            }
            //console.warn('setCurrentStep this.offset reajust', this.offset, this.state.iosTopInset, this.state.iosBottomInset);
          }

          setTimeout(() => this._timeout(move), this.state.flatList ? 100 : 0);
        }


        maxRetry = 0;
        _timeout = async (move) =>
      {
        if (move)
        {
          const size = await this.state.currentStep.target.measure(this.offset, this.state.flatList);
          if(!size)
          {
            if (this.maxRetry > MAX_START_TRIES) {
              this.maxRetry = 0;
              return;
            }
            this.maxRetry += 1;
            //console.warn('currentStep', this.state.currentStep);
            //console.warn('TRY RESOLVED SIZE');
            this.state.currentStep = this.state.steps[this.state.currentStep.name];
            requestAnimationFrame(() => this._timeout(move));
            return;
          }
          //console.warn(size);
          this.moveToCurrentStep();
        }
      }


        setVisibility = (visible: boolean): void => new Promise((resolve) => {
          this.setState({ visible }, () => resolve());
        });

        startTries = 0;

        mounted = false;

        eventEmitter = mitt();

        isFirstStep = (): boolean => this.state.currentStep === this.getFirstStep();

        isLastStep = (): boolean => this.state.currentStep === this.getLastStep();

        registerStep = (step: Step): void => {
          //console.warn('register step', step.name);
          this.setState(({ steps }) => ({
            steps: {
              ...steps,
              [step.name]: step,
            },
          }));
        }

        isRegisterStep = (wrapper, stepName: string): boolean => {
          //console.warn('isRegisterStep ' + stepName, this.state.steps[stepName] ? true : false);
          const already = this.state.steps[stepName] ? true : false;
          if(!already)
          {
            //console.warn('already register');
            return false;
          }
          const step = this.state.steps[stepName].target.wrapper;
          if(!step)
          {
            //console.warn('new wrapper');
            return false;
          }

          const tagStep = ReactNative.findNodeHandle(step);
          const tagWrapper = ReactNative.findNodeHandle(wrapper);
          //console.warn('tagStep', tagStep);
          //console.warn('tagWrapper', tagWrapper);
          return  tagStep === tagWrapper;
        }

        unregisterStep = (stepName: string): void => {
          //console.warn('unregister step', stepName);
          if (!this.mounted) {
            return;
          }
          this.setState(({ steps }) => ({
            steps: Object.entries(steps)
                .filter(([key]) => key !== stepName)
                .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {}),
          }));
        }

        next = async (): void => {
          await this.setCurrentStep(this.getNextStep());
        }

        prev = async (): void => {
          await this.setCurrentStep(this.getPrevStep());
        }

        start = async (fromStep?: string, flatList, layout): void => {
          const { steps } = this.state;
          //console.warn('start step', fromStep);
          //console.warn('start flatlist', flatList ? true : false);
          const currentStep = fromStep
              ? steps[fromStep]
              : this.getFirstStep();

          //console.warn('start layout', layout);
          this.state.flatList = flatList ? flatList : null;
          this.state.layout = layout ? layout : null;


          if (this.startTries > MAX_START_TRIES) {
            this.startTries = 0;
            return;
          }

          if (!currentStep) {
            this.startTries += 1;
            requestAnimationFrame(() => this.start(fromStep, flatList, layout));
          } else {
            this.eventEmitter.emit('start');
            console.warn('start tuto');
            await this.setCurrentStep(currentStep);
            await this.moveToCurrentStep();
            await this.setVisibility(true);
            this.startTries = 0;
          }
        }

        updateFlatlist = async (flatlist) =>
        {
          //console.warn('resync flatlist', flatlist, ReactNative.findNodeHandle(flatlist));
          this.state.flatList = flatlist ? flatlist : null;
        }
        updateLayout = async (layout) =>
        {
          //console.warn('resync layout', layout);
          this.state.layout = layout;
        }

        stop = async (): void => {
          await this.setVisibility(false);
          this.eventEmitter.emit('stop');
        }

        _onPressCopilot = (current) =>
        {

          this.eventEmitter.emit('copilotOnPress', current);
        }

        _onPressLeave = () =>
        {
          this.eventEmitter.emit('copilotOnPressLeave');
        }

        async moveToCurrentStep(): void {
        	//console.warn('this.state.flatList', this.state.flatList ? true : false);

          const size = await this.state.currentStep.target.measure( this.offset, this.state.flatList);
          //console.warn('OnMove', size);
          await this.modal.animateMove({
            width: size.width + OFFSET_WIDTH,
            height: size.height + OFFSET_WIDTH,
            left: size.x - (OFFSET_WIDTH / 2),
            top: (size.y - (OFFSET_WIDTH / 2)) + verticalOffset,
          });
        }


        render() {
          return (
              <View style={wrapperStyle || { flex: 1 }}>
                  <WrappedComponent
                      {...this.props}
                      start={this.start}
                      stop={this.stop}
                      setInsetBottom={this.setInsetBottom}
                      setInsetTop={this.setInsetTop}
                      updateFlatlist={this.updateFlatlist}
                      updateLayout={this.updateLayout}
                      currentStep={this.state.currentStep}
                      visible={this.state.visible}
                      copilotEvents={this.eventEmitter}
                  />
                  <CopilotModal
                      next={this.next}
                      prev={this.prev}
                      stop={this.stop}
                      onPress={this._onPressCopilot}
                      visible={this.state.visible}
                      stopBetween={stopBetween}
                      isFirstStep={this.isFirstStep()}
                      isLastStep={this.isLastStep()}
                      currentStepNumber={this.getStepNumber()}
                      currentStep={this.state.currentStep}
                      stepNumberComponent={stepNumberComponent}
                      totalSteps={totalSteps}
                      tooltipComponent={tooltipComponent}
                      tooltipStyle={tooltipStyle}
                      insetTop={this.state.iosTopInset}
                      insetBottom={this.state.iosBottomInset}
                      overlay={overlay}
                      labelLeave={labelLeave}
                      onPressLeave={this._onPressLeave}
                      animated={animated}
                      androidStatusBarVisible={androidStatusBarVisible}
                      backdropColor={backdropColor}
                      svgMaskPath={svgMaskPath}
                      ref={(modal) => { this.modal = modal; }}
                  />
              </View>
          );
        }
      }

      Copilot.childContextTypes = {
        _copilot: PropTypes.object.isRequired,
      };

      return hoistStatics(Copilot, WrappedComponent);
    };

export default copilot;
