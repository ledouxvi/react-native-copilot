// @flow
import React, { Component } from 'react';

import type { CopilotContext } from '../types';
import ReactNative from 'react-native';

type Props = {
  name: string,
  text: string,
  order: number,
  active?: boolean,
  _copilot: CopilotContext,
  children: React$Element
};

class ConnectedCopilotStep extends Component<Props> {
  static defaultProps = {
    active: true,
  };

  componentDidMount() {
    console.warn('did mount', this.props.name, this.props.active);
    if (this.props.active) {
      this.register();
    }
  }

  componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS): void
  {
    console.warn('did update', this.props.name, prevProps.active, this.props.active);
    /*if (prevProps.active !== this.props.active) {*/
      if (this.props.active) {
        if(this.isRegister() === false)
        {
          console.warn('register');
          this.register();
        }
      } else {
        this.unregister();
      }
   /* }*/
  }

  componentWillUnmount() {
    this.unregister();
  }

  setNativeProps(obj) {
    this.wrapper.setNativeProps(obj);
  }

  register() {
    this.props._copilot.registerStep({
      name: this.props.name,
      text: this.props.text,
      order: this.props.order,
      target: this,
      wrapper: this.wrapper,
    });
  }
  
  isRegister() {
    return this.props._copilot.isRegisterStep(this.wrapper, this.props.name);
  }

  unregister() {
    console.warn('unregister from connected');
    this.props._copilot.unregisterStep(this.props.name);
  }

  measure(offset, flatList) {
    if (typeof __TEST__ !== 'undefined' && __TEST__) { // eslint-disable-line no-undef
      return new Promise(resolve => resolve({
        x: 0, y: 0, width: 0, height: 0,
      }));
    }

    return new Promise((resolve, reject) => {
      const measure = async () => {
        // Wait until the wrapper element appears
        if (this.wrapper)
        {
          if (Platform.OS === 'android')
          {
            if(offset)
            {
              const sizeResolved = await this._measureLayout(flatList);
              if(sizeResolved)
              {
                console.warn('measureLaytou', sizeResolved);
                resolve({
                  x: sizeResolved.x, y: sizeResolved.y - offset, width: sizeResolved.width, height: sizeResolved.height,
                });
              }
              else
              {
                resolve(false);
              }
              return;
            }
              if (this.wrapper.measureInWindow)
              {
                  this.wrapper.measureInWindow((x, y, width, height) =>
                  {
                    console.warn('measureInWindow2', {
                      x, y, width, height,
                    });
        
                      resolve({
                        x,
                        y,
                        width,
                        height,
                      });
                    
                  });
              }
              else
              {
                requestAnimationFrame(measure);
              }
            
          }
          else {
            if (this.wrapper.measure)
            {
              this.wrapper.measure((x, y, width, height) =>
              {
                resolve({
                  x, y, width, height,
                })
              }, reject);
            }
            else
            {
              requestAnimationFrame(measure);
            }
          }
        } else {
          requestAnimationFrame(measure);
        }
      };

      requestAnimationFrame(measure);
    });
  }
  
  _measureLayout(flatList) {
    return new Promise(async (resolve, reject) => {
      console.warn('promise');
      const resize = await this.wrapper.measureLayout(ReactNative.findNodeHandle(flatList), (x, y, width, height) =>
      {
        console.warn('measureLayout', {
          x,
          y,
          width,
          height,
        });
        resolve({
          x,
          y,
          width,
          height,
        });
      }, (error) => {console.warn('error', error); resolve(false);});
    });
  }

  render() {
    const copilot = {
      ref: (wrapper) => { this.wrapper = wrapper; },
      onLayout: () => { }, // Android hack
    };

    return React.cloneElement(this.props.children, { copilot });
  }
}

export default ConnectedCopilotStep;
