
import React, { Component } from 'react';
import { TouchableHighlight, Text, View, SafeAreaView, Alert, Image, ImageBackground, TextInput, Platform, Dimensions, Linking, StatusBar, AppState, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage'
import DeviceInfo from 'react-native-device-info';
import appsFlyer from 'react-native-appsflyer';

import Notification from '../Components/Notification';
import Loader from '../Components/LoaderSecond';
import NoInternet from '../Components/NoInternet';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

const { width, height } = Dimensions.get("window");

export default class SplashScreenView extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            showSplashScreenImage: 1,
        }
    }

    async componentDidMount() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Music',
                    message: 'App needs access to your Files... ',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                // console.log('startDownload...');
            }
        } catch (err) {
            // console.log("err catch==>", err);
        }
        // AsyncStorage.setItem('install_app_flag', JSON.stringify(0));
        // AsyncStorage.setItem('login_flag', '');  // 0 => Logout // 1 => Email  // 2 => Social
        // AsyncStorage.setItem('email', '');
        // AsyncStorage.setItem('password', '');
        // AsyncStorage.setItem('social_id', '');
        // AsyncStorage.setItem('social_type', '');
        // AsyncStorage.setItem('rate_flag', '');
        global.USER_DATA = [];
        global.USER_CREATED_DAYS = 555;
        global.IS_SUBSCRIBE = false;
        global.HIDE_INNER_CIRCLE_TIER = true;
        appsFlyer.initSdk(
            {
                devKey: 'aNPCN6auSrzidSGCeMrg9R',
                isDebug: false, // set to true if you want to see data in the logs 
                appId: '1456729917', // iOS app id
            },
            (result) => {
                // console.log("appsFlyer ---> ", result);
            },
            (error) => {
                // console.error("appsFlyer ---> ", error);
            }
        );

        // setTimeout(function () {
        //     const eventName = "Register";
        //     const eventValues = {
        //         id: "register id",
        //     };
        //     appsFlyer.logEvent(
        //         eventName,
        //         eventValues,
        //         (res) => {
        //             console.log("appsFlyer Event ---> ", res);
        //         },
        //         (err) => {
        //             console.error("appsFlyer Event ---> ", err);
        //         }
        //     );
        // }.bind(this), 2000);

        // setTimeout(function () {
        //     const eventName = "Purchase Success";
        //     const eventValues = {
        //         id: "purchase.productId",
        //     };
        //     appsFlyer.logEvent(
        //         eventName,
        //         eventValues,
        //         (res) => {
        //             console.log("appsFlyer Event ---> ", res);
        //         },
        //         (err) => {
        //             console.error("appsFlyer Event ---> ", err);
        //         }
        //     );
        // }.bind(this), 2000);


        // setTimeout(function () {
        // this.getData()
        // }.bind(this), 2000);
        setTimeout(function () {
            this.setState({ showSplashScreenImage: 2 }, () => {
                setTimeout(function () {
                    this.setState({ showSplashScreenImage: 3 }, () => {
                        setTimeout(function () {
                            this.props.navigation.navigate('LandingView', { transition: 'bottomUp' });
                        }.bind(this), 2000);
                    });
                }.bind(this), 2000);
            });
        }.bind(this), 2000);
    }

    componentWillUnmount() {
    }

    render() {
        const { navigate } = this.props.navigation;
        return (
            <View style={[AppCommon.mainContainer, Common.alignItmCenter, Common.justifyCenter, Colors.whiteBgColor]}>
                <Notification screen='SplashScreenView' />
                <Loader visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.whiteBgColor]}></SafeAreaView> */}
                <NoInternet />
                {Platform.OS == 'ios' ?
                    <StatusBar translucent hidden={false} backgroundColor={Colors.whiteBgColor} barStyle="light-content" />
                    : null}
                <View style={[]}>
                    <ImageBackground
                        source={this.state.showSplashScreenImage == 1 ? require('../Images/SplashScreen_1.png') : this.state.showSplashScreenImage == 2 ? require('../Images/SplashScreen_2.png') : require('../Images/SplashScreen_3.png')}
                        style={[AppCommon.splashScreenLogo, Common.justifyFEnd, Common.alignItmCenter]}
                        imageStyle={[AppCommon.splashScreenLogo]}>
                        <View style={[Common.justifyCenter, Common.alignItmCenter]}>
                            <View style={[Common.justifyCenter, Common.alignItmCenter]}>
                                <Text style={[AppCommon.h1Big2, Colors.whiteFnColor, Input.textCenter, Input.fontBold]}>Resonize for</Text>
                            </View>
                            <View style={[Common.marginTop3, Common.flexRow, Common.justifyCenter, Common.alignItmCenter]}>
                                <Image source={require('../Images/SplashScreenLogo_1.png')} style={[Common.width50, Common.height50, { resizeMode: "contain" }]} />
                                <Image source={require('../Images/SplashScreenLogo_2.png')} style={[Common.marginLeft10, Common.width180, Common.height50, { resizeMode: "contain" }]} />
                            </View>
                            <View style={[Common.marginBottom50]}></View>
                        </View>
                    </ImageBackground>
                </View >
            </View >
        );
    }
}