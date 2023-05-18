
import React, { Component } from 'react';
import { TouchableHighlight, Text, BackHandler, View, SafeAreaView, Image, ImageBackground, StatusBar, RefreshControl, Dimensions, Alert, TextInput, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-community/async-storage';
import RNIap, { Product, ProductPurchase, InAppPurchase, PurchaseError, SubscriptionPurchase, acknowledgePurchaseAndroid, consumePurchaseAndroid, finishTransaction, finishTransactionIOS, purchaseErrorListener, purchaseUpdatedListener, } from 'react-native-iap';
import RNFetchBlob from 'rn-fetch-blob';

import Notification from '../Components/Notification';
import Loader from '../Components/LoaderSecond';
import NoInternet from '../Components/NoInternet';
import DisclaimerView from '../Components/DisclaimerView'
import AboutView from '../Components/AboutView'
import SmallPlayerView from '../Components/SmallPlayerView';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

let purchaseUpdateSubscription;
let purchaseErrorSubscription;

export default class SettingsTab extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            showAboutView: false,
            showDisclaimerView: false,
            subscription_amt: '',
            productList: [],
            myReceipt: null,
            select_iap: '',
            iOSPrice: '3.99',
            iOSQuatumOneYear: "resonize.qicoil.annual",
            androidPrice: '3.99',
            androidQuatumOneYear: "com.rifemachfrq.annual",
        }
        this.clickRestorePurchases = this.clickRestorePurchases.bind(this)
        this.openDisclaimer = this.openDisclaimer.bind(this)
        this.closeDisclaimerView = this.closeDisclaimerView.bind(this)
        this.openAbout = this.openAbout.bind(this)
        this.closeAboutView = this.closeAboutView.bind(this)
        this.showPlayerView = this.showPlayerView.bind(this);
    }

    async componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        try {
            const result = await RNIap.initConnection();
            // console.log('connection is => ', result);
            // await RNIap.consumeAllItemsAndroid();
            if (Platform.OS === 'android') {
                await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
            } else {
                await RNIap.clearTransactionIOS();
            }
        } catch (err) {
            // console.log('error in cdm => ', err);
        }
        purchaseUpdateSubscription = purchaseUpdatedListener(
            async (purchase) => {
                // console.log('purchaseUpdatedListener ==> ', purchase);
                var receipt = purchase.transactionReceipt ? purchase.transactionReceipt : purchase.originalJson;
                // console.log("purchaseUpdatedListener receipt ==>", receipt);
                if (receipt) {
                    try {
                        var ackResult = await finishTransaction(purchase);
                        // console.log("purchaseUpdatedListener ackResult ==>", ackResult);
                    } catch (error) {
                        // console.log("purchaseUpdatedListener ==>", error);
                        // Alert.alert("purchaseUpdatedListener", error.message, [{
                        //     text: 'Ok',
                        //     onPress: () => { },
                        //     style: 'cancel'
                        // }])
                    }
                }
                if (purchase.purchaseStateAndroid === 1 && !purchase.isAcknowledgedAndroid) {
                    try {
                        const ackResult = await acknowledgePurchaseAndroid(purchase.purchaseToken);
                        // console.log('ackResult', ackResult);
                    } catch (ackErr) {
                        // console.log('ackErr', ackErr);
                    }
                }
                this.setState({ myReceipt: purchase.transactionReceipt });
            },
        );
        purchaseErrorSubscription = purchaseErrorListener(
            (error) => {
                // console.log("purchaseErrorSubscription error ==>", error);
                // Alert.alert("purchaseErrorSubscription", error.message, [{
                //     text: 'Ok',
                //     onPress: () => { },
                //     style: 'cancel'
                // }])
            },
        );
    }

    componentWillReceiveProps(nextProps) {
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        if (purchaseUpdateSubscription) {
            purchaseUpdateSubscription.remove();
            purchaseUpdateSubscription = null;
        }
        if (purchaseErrorSubscription) {
            purchaseErrorSubscription.remove();
            purchaseErrorSubscription = null;
        }
    }

    handleBackButton = () => {
        Alert.alert(
            'Exit App',
            'Are you sure to exit?', [{
                text: 'Cancel',
                onPress: () => { },
                style: 'cancel'
            }, {
                text: 'OK',
                onPress: () => { BackHandler.exitApp() },
            },], {
            cancelable: false
        }
        )
        return true;
    }

    handleOnNavigateBack = (foo) => {
        this.setState({ foo: foo })
    }

    openEditProfile() {
        this.props.navigation.navigate('EditProfile', {
            transition: 'bottomUp',
            onNavigateBack: this.handleOnNavigateBack.bind(this),
        });
    }

    clickRestorePurchases() {
        var select_iap = ''
        var subscription_amt = ''
        if (Platform.OS == 'ios') {
            select_iap = this.state.iOSQuatumOneYear
            subscription_amt = this.state.iOSPrice
        } else {
            select_iap = this.state.androidQuatumOneYear
            subscription_amt = this.state.androidPrice
        }
        this.setState({
            select_iap: select_iap,
            subscription_amt: subscription_amt,
        }, () => {
            this.getAvailablePurchases(this.state.select_iap);
        });
    }

    getAvailablePurchases = async () => {
        this.setState({ isLoading: true });
        try {
            const availablePurchases = await RNIap.getAvailablePurchases();
            if (availablePurchases && availablePurchases.length > 0) {
                const sortedAvailablePurchases = availablePurchases.sort(
                    (a, b) => b.transactionDate - a.transactionDate
                );
                var dataArray = sortedAvailablePurchases[0]
                // console.log("transaction_date ==>", dataArray.transactionDate)
                // console.log("transaction_id ==>", dataArray.transactionId)
                // console.log("product_id ==>", dataArray.productId)
                // console.log("transaction_receipt ==>", dataArray.transactionReceipt)
                this.setState({
                    isLoading: false,
                    myReceipt: availablePurchases[0].transactionReceipt,
                }, () => {
                    this.savePaymentIos(dataArray)
                });
            } else {
                this.setState({ isLoading: false });
                Alert.alert("NOTIFICATION", 'Your purchases not available please subscribe', [{
                    text: 'Ok',
                    onPress: () => { },
                    style: 'cancel'
                }])
            }
        } catch (err) {
            // console.log("getAvailablePurchases err ==>", err)
            this.setState({ isLoading: false });
            // webFunctions.savePaymentLogIos('Setting getAvailablePurchases err', err.message)
            Alert.alert("getAvailablePurchases", err.message, [{
                text: 'Ok',
                onPress: () => { },
                style: 'cancel'
            }])
        }
    }

    savePaymentIos(dataArray = []) {
        if (this.state.subscription_amt) {
            this.setState({ isLoading: true });
            // console.log("user_id ==>", global.USER_DATA.id.toString())
            // console.log("subscription_amt ==>", this.state.subscription_amt)
            // console.log("transaction_date ==>", dataArray.transactionDate)
            // console.log("transaction_id ==>", dataArray.transactionId)
            // console.log("product_id ==>", dataArray.productId)
            // console.log("transaction_receipt ==>", dataArray.transactionReceipt)

            var transactionDate = 0
            transactionDate = parseInt(dataArray.transactionDate)
            const date = new Date(transactionDate);
            transactionDate = date.toLocaleString('sv')

            var data_Array = [];
            data_Array.push({ name: 'user_id', data: global.USER_DATA.id.toString() });
            data_Array.push({ name: 'subscription_amt', data: this.state.subscription_amt.toString() });
            data_Array.push({ name: 'transaction_date', data: transactionDate.toString() });
            data_Array.push({ name: 'transaction_id', data: dataArray.transactionId.toString() });
            data_Array.push({ name: 'product_id', data: dataArray.productId.toString() });
            data_Array.push({ name: 'transaction_receipt', data: dataArray.transactionReceipt.toString() });
            data_Array.push({ name: 'category_id', data: '1' });
            data_Array.push({ name: 'plan_type', data: 'yearly' });
            if (Platform.OS == 'ios') {
                data_Array.push({ name: 'pay_type', data: '1' });
            } else {
                data_Array.push({ name: 'pay_type', data: '2' });
            }
            RNFetchBlob.fetch('POST', global.SAVE_SUBSCRIPTION, {
                'Content-Type': 'multipart/form-data',
            }, data_Array).then((response) => {
                response = response.json();
                var resultArray = response['subscribe_dtl'];
                if (resultArray.length > 0) {
                    resultArray = resultArray[0]
                    if (resultArray.fetch_flag == "1") {
                        AsyncStorage.getItem('login_flag', (err, login_flag) => {
                            if (login_flag == "1") {
                                AsyncStorage.getItem('email', (err, email) => {
                                    if (email) {
                                        AsyncStorage.getItem('password', (err, password) => {
                                            if (password) {
                                                webFunctions.getUserData(JSON.parse(login_flag), JSON.parse(email), JSON.parse(password), '', '');
                                            }
                                        });
                                    }
                                });
                            } else if (login_flag == "2") {
                                AsyncStorage.getItem('social_id', (err, social_id) => {
                                    if (social_id) {
                                        AsyncStorage.getItem('social_type', (err, social_type) => {
                                            if (social_type) {
                                                webFunctions.getUserData(JSON.parse(login_flag), '', '', JSON.parse(social_id), JSON.parse(social_type));
                                            }
                                        });
                                    }
                                });
                            }
                        });
                        global.IS_SUBSCRIBE = true;
                        setTimeout(function () {
                            this.setState({ isLoading: false });
                            Alert.alert(resultArray.rsp_title, resultArray.rsp_msg, [{
                                text: 'Ok',
                                onPress: () => { },
                                style: 'cancel'
                            }])
                        }.bind(this), 2000);
                    } else {
                        this.setState({ isLoading: false });
                        Alert.alert(resultArray.rsp_title, resultArray.rsp_msg, [{
                            text: 'Ok',
                            onPress: () => { },
                            style: 'cancel'
                        }])
                    }
                } else {
                    this.setState({ isLoading: false });
                    Alert.alert('NOTIFICATION', 'Something went wrong, please try again', [{
                        text: 'Ok',
                        onPress: () => { },
                        style: 'cancel'
                    }]);
                }
            }).catch((error) => {
                this.setState({ isLoading: false });
                Alert.alert('Alert', 'Something went wrong, please try again', [{
                    text: 'Ok',
                    onPress: () => { },
                    style: 'cancel'
                }]);
            });
        }
    }

    openSecondSubscribeView() {
        this.props.navigation.navigate('SecondSubscribeView', {
            callType: 'SettingsTab',
            transition: 'bottomUp'
        });
    }

    openSubscribeView() {
        this.props.navigation.navigate('SubscribeView', {
            callType: 'SettingsTab',
            transition: 'bottomUp'
        });
    }

    openInstructions() {
        this.props.navigation.navigate('InstructionView', { transition: 'bottomUp' });
    }

    openDisclaimer() {
        this.setState({ showDisclaimerView: true })
    }

    closeDisclaimerView() {
        this.setState({ showDisclaimerView: false })
    }

    openAbout() {
        this.setState({ showAboutView: true })
    }

    closeAboutView() {
        this.setState({ showAboutView: false })
    }

    openHelpSupport() {
        this.props.navigation.navigate('HelpSupport', { callType: 'SettingsTab', transition: 'bottomUp' });
    }

    openTerms() {
        this.props.navigation.navigate('OpenWebView', {
            title: 'Terms & Conditions',
            url: global.TERMS_CONDITIONS,
            transition: 'bottomUp'
        });
    }

    openPrivacy() {
        this.props.navigation.navigate('OpenWebView', {
            title: 'Privacy Policy',
            url: global.PRIVACY_POLICY,
            transition: 'bottomUp'
        });
    }

    logout() {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            Alert.alert('Resonize for Qi Coil', 'Are you sure you want to logout?', [{
                text: 'NO',
                onPress: () => { },
                style: 'cancel'
            }, {
                text: 'OK',
                onPress: () => { this.userLogOut() },
                style: 'default'
            }]);
        } else {
            this.props.navigation.navigate('LandingView', { transition: 'bottomUp' });
        }
    }

    userLogOut() {
        AsyncStorage.setItem('email', '');
        AsyncStorage.setItem('password', '');
        AsyncStorage.setItem('social_id', '');
        AsyncStorage.setItem('social_type', '');
        AsyncStorage.setItem('login_flag', '', () => {
            global.USER_DATA = [];
            global.TAB_INDEX = 0;
            global.USER_CREATED_DAYS = 555;
            global.IS_SUBSCRIBE = false;
            global.HIDE_INNER_CIRCLE_TIER = true;
            this.props.navigation.navigate('LandingView', { transition: 'bottomUp' });
        });
    }

    showPlayerView() {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            if (global.PLAYER_USED == 0) {
                if (global.IS_SUBSCRIBE == false) {
                    if (global.USER_CREATED_DAYS > 7 && global.TOTAL_PLAY_TIME > 1799) {
                        this.props.navigation.navigate('SecondSubscribeView', { transition: 'bottomUp' });
                        return
                    }
                }
                this.props.navigation.navigate('PlayerView', {
                    callType: 'SmallPlayerView',
                    transition: 'bottomUp',
                    onNavigateBack: this.handleOnNavigateBack.bind(this),
                });
            } else {
                this.props.navigation.navigate('QiCoilPlayer', {
                    callType: 'SmallPlayerView',
                    transition: 'bottomUp',
                    onNavigateBack: this.handleOnNavigateBack.bind(this),
                });
            }
        } else {
            this.props.navigation.navigate('LandingView', { transition: 'bottomUp' });
        }
    }

    render() {
        var name = ''
        if (global.USER_DATA.name && global.USER_DATA.name != undefined) {
            name = global.USER_DATA.name
        }
        return (
            <View style={[AppCommon.mainContainer, Colors.lightBlackBgColor]}>
                <Notification screen='SettingsTab' />
                <Loader visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.lightBlackBgColor]}>
                </SafeAreaView> */}
                {Platform.OS == 'ios' ?
                    <StatusBar translucent backgroundColor={Colors.lightBlackBgColor} barStyle="light-content" />
                    : null}
                <ImageBackground
                    source={require('../Images/TopBarBG.png')}
                    style={[AppCommon.topViewImage]}
                    imageStyle={[AppCommon.topViewImage,]}>
                    <View style={[global.FULL_DISPLAY ? Common.marginTop60 : Common.marginTop40, Common.marginHorizontal20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>{name}</Text>
                    </View>
                </ImageBackground>
                <NoInternet />
                <View style={[AppCommon.container, Common.marginTop20]}>
                    {global.USER_DATA.id && global.USER_DATA.id != undefined && global.IS_SUBSCRIBE == false ?
                        <TouchableHighlight
                            onPress={() => { this.openEditProfile() }}
                            underlayColor={global.TRANSPARENT_COLOR}
                            style={[Common.marginTop20]}>
                            <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Edit Profile</Text>
                        </TouchableHighlight>
                        :
                        null}
                    {global.USER_DATA.id && global.USER_DATA.id != undefined && global.IS_SUBSCRIBE == false ?
                        global.USER_CREATED_DAYS > 7 ?
                            <TouchableHighlight
                                onPress={() => { this.openSecondSubscribeView() }}
                                underlayColor={global.TRANSPARENT_COLOR}
                                style={[Common.marginTop20]}>
                                <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Subscribe</Text>
                            </TouchableHighlight>
                            :
                            <TouchableHighlight
                                onPress={() => { this.openSubscribeView() }}
                                underlayColor={global.TRANSPARENT_COLOR}
                                style={[Common.marginTop20]}>
                                <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Subscribe</Text>
                            </TouchableHighlight>
                        : null}
                    {global.USER_DATA.id && global.USER_DATA.id != undefined && global.IS_SUBSCRIBE == false ?
                        <TouchableHighlight
                            onPress={() => { this.clickRestorePurchases() }}
                            underlayColor={global.TRANSPARENT_COLOR}
                            style={[Common.marginTop20]}>
                            <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Restore Purchases</Text>
                        </TouchableHighlight>
                        :
                        null}
                    {/* <TouchableHighlight
                        onPress={() => { this.openInstructions() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Instructions</Text>
                    </TouchableHighlight> */}
                    <TouchableHighlight
                        onPress={() => { this.openDisclaimer() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Disclaimer</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        onPress={() => { this.openAbout() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>About</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        onPress={() => { this.openHelpSupport() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Help & Support</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        onPress={() => { this.openTerms() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Terms</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        onPress={() => { this.openPrivacy() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Privacy</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        onPress={() => this.logout()}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop20]}>
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>{global.USER_DATA.id && global.USER_DATA.id != undefined ? 'Logout' : 'Sign In'}</Text>
                    </TouchableHighlight>
                </View >
                <Modal
                    backdropOpacity={0.5}
                    animationIn={"zoomIn"}
                    animationOut={"zoomOut"}
                    onBackButtonPress={() => { this.closeAboutView() }}
                    onBackdropPress={() => { this.closeAboutView() }}
                    isVisible={this.state.showAboutView}
                    style={[Common.margin0, Common.justifyCenter, Common.alignItmCenter]}>
                    <AboutView
                        closeAboutView={() => { this.closeAboutView() }}
                    />
                </Modal>
                <Modal
                    backdropOpacity={0.5}
                    animationIn={"zoomIn"}
                    animationOut={"zoomOut"}
                    onBackButtonPress={() => { this.closeDisclaimerView() }}
                    onBackdropPress={() => { this.closeDisclaimerView() }}
                    isVisible={this.state.showDisclaimerView}
                    style={[Common.margin0, Common.justifyCenter, Common.alignItmCenter]}>
                    <DisclaimerView
                        closeDisclaimerView={() => { this.closeDisclaimerView() }}
                    />
                </Modal>
                <SmallPlayerView screen='SettingsTab' showPlayerView={this.showPlayerView} />
            </View >
        );
    }
}