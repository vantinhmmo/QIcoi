import React, { Component } from 'react';
import { TouchableHighlight, Text, View, SafeAreaView, Image, FlatList, StatusBar, NativeModules, RefreshControl, Dimensions, Alert, Platform, ScrollView, Linking, AppState, TextInput, ImageBackground, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
import RNFetchBlob from 'rn-fetch-blob';
import RNIap, { Product, ProductPurchase, InAppPurchase, PurchaseError, SubscriptionPurchase, acknowledgePurchaseAndroid, consumePurchaseAndroid, finishTransaction, finishTransactionIOS, purchaseErrorListener, purchaseUpdatedListener, } from 'react-native-iap';
import LinearGradient from 'react-native-linear-gradient';

import Notification from '../Components/Notification';
import NoInternet from '../Components/NoInternet';
import LoaderSecond from '../Components/LoaderSecond';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

let purchaseUpdateSubscription;
let purchaseErrorSubscription;

export default class MasterQuantumSubView extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            callType: '',
            subscription_amt: '',
            subscribeList: [
                { name: 'Essential Frequencies for Wellness and Meditation' },
                { name: '2-3 Dimensional' },
                { name: '822+ Quantum Frequencies' },
            ],
            productList: [],
            myReceipt: null,
            select_iap: '',
            iOSPrice: '2.99',
            iOSQuatumOneMonth: "resonize.masterquantum.month",
            androidPrice: '2.99',
            androidQuatumOneMonth: "resonize.master.quantum.month",
        }
        this.clickContinue = this.clickContinue.bind(this);
        this.clickRestorePurchases = this.clickRestorePurchases.bind(this)
        // Resonize for Qi Coil Master Month
        // resonize.masterquantum.month
        // Resonize for Qi Coil Higher Month
        // resonize.higherquantum.month
    }

    async componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        let callType = this.props.navigation.getParam('callType', '');
        this.setState({
            callType: callType,
        }, () => {
        });
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
        var select_iap = ''
        if (Platform.OS == 'ios') {
            select_iap = this.state.iOSQuatumOneMonth
        } else {
            select_iap = this.state.androidQuatumOneMonth
        }
        this.setState({
            select_iap: select_iap,
        }, () => {
            this.getSubscriptionAmt()
        });
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
        this.backButtonClick()
        return true
    }

    handleOnNavigateBack = (foo) => {
        this.setState({ foo })
    }

    backButtonClick() {
        this.props.navigation.goBack()
        // global.TAB_INDEX = 2;
        // this.props.navigation.navigate('QiCoilTabNavigator', { transition: 'bottomUp' });
    }

    async getSubscriptionAmt() {
        try {
            const products = await RNIap.getProducts([this.state.select_iap]);
            if (Platform.OS == 'ios') {
                this.setState({ iOSPrice: products[0].localizedPrice });
            } else {
                this.setState({ androidPrice: products[0].localizedPrice });
            }
            this.setState({ productList: products });
        } catch (err) {
            this.setState({ isLoading: false });
        }
    }

    clickContinue() {
        // console.log("On Continue Click ==>")
        var select_iap = ''
        var subscription_amt = ''
        if (Platform.OS == 'ios') {
            select_iap = this.state.iOSQuatumOneMonth
            subscription_amt = this.state.iOSPrice
        } else {
            select_iap = this.state.androidQuatumOneMonth
            subscription_amt = this.state.androidPrice
        }
        this.setState({
            select_iap: select_iap,
            subscription_amt: subscription_amt,
        }, () => {
            this.requestSubscription(this.state.select_iap);
        });
    }

    requestSubscription = async (sku) => {
        // console.log("requestSubscription ==> ", sku)
        this.setState({ isLoading: true });
        try {
            await this.getItems();
            // await RNIap.requestSubscription(sku);
        } catch (err) {
            // console.log("requestSubscription err ==>", err)
            this.setState({ isLoading: false });
            // webFunctions.savePaymentLogIos('Setting requestSubscription err', err.message)
            Alert.alert("requestSubscription", err.message, [{
                text: 'Ok',
                onPress: () => { },
                style: 'cancel'
            }])
        }
    };

    getItems = async () => {
        // console.log("getItems ==> ", this.state.select_iap)
        try {
            const products = await RNIap.getProducts([this.state.select_iap]);
            const subscription = await RNIap.getSubscriptions([this.state.select_iap]);
            // console.log("products ==>", products)
            // console.log("subscription ==>", subscription)
            this.setState({ productList: products });
            this.requestPurchase(this.state.select_iap);
        } catch (err) {
            // console.log("getItems err ==>", err)
            this.setState({ isLoading: false });
            // webFunctions.savePaymentLogIos('Setting getItems err', err.message)
            Alert.alert("getItems", err.message, [{
                text: 'Ok',
                onPress: () => { },
                style: 'cancel'
            }])
        }
    };

    requestPurchase = async (sku) => {
        // console.log("requestPurchase ==> ", sku)
        try {
            const data = await RNIap.requestPurchase(sku);
            // console.log("requestPurchase data ==>", data)
            this.savePaymentIos(data)
        } catch (err) {
            // console.log("requestPurchase err ==>", err)
            this.setState({ isLoading: false });
            // webFunctions.savePaymentLogIos('Setting requestPurchase err', err.message)
            Alert.alert("Request Purchase", err.message, [{
                text: 'Ok',
                onPress: () => { },
                style: 'cancel'
            }])
        }
    };

    // getSubscriptions = async () => {
    //     console.log("getSubscriptions ==> ")
    //     try {
    //         const products = await RNIap.getSubscriptions([this.state.select_iap]);
    //         console.log("getSubscriptions products ==>", products)
    //         this.setState({ products: products }, () => {
    //             // this.requestPurchase(this.state.select_iap);
    //         });
    //     } catch (err) {
    //         console.log("getSubscriptions err ==>", err)
    //         this.setState({ isLoading: false });
    //         // webFunctions.savePaymentLogIos('Setting getSubscriptions err', err.message)
    //         Alert.alert("getSubscriptions", err.message, [{
    //             text: 'Ok',
    //             onPress: () => { },
    //             style: 'cancel'
    //         }])
    //     }
    // };

    clickRestorePurchases() {
        var select_iap = ''
        var subscription_amt = ''
        if (Platform.OS == 'ios') {
            select_iap = this.state.iOSQuatumOneMonth
            subscription_amt = this.state.iOSPrice
        } else {
            select_iap = this.state.androidQuatumOneMonth
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
            data_Array.push({ name: 'category_id', data: '2' });
            data_Array.push({ name: 'plan_type', data: 'monthly' });
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
                                onPress: () => {
                                    global.TAB_INDEX = 2;
                                    this.props.navigation.navigate('QiCoilTabNavigator', { transition: 'bottomUp' });
                                },
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

            // var query_string = "?user_id=" + global.USER_DATA.id.toString();
            // query_string += "&subscription_amt=" + this.state.subscription_amt;
            // query_string += "&transaction_date=" + dataArray.transactionDate;
            // query_string += "&transaction_id=" + dataArray.transactionId;
            // query_string += "&product_id=" + dataArray.productId;
            // query_string += "&transaction_receipt=" + dataArray.transactionReceipt;
            // var url = encodeURI(global.SAVE_SUBSCRIPTION + query_string);
            // console.log('savePaymentIos url ==> ', url)
            // fetch(url, {
            //     method: 'GET',
            //     headers: new Headers({
            //         'Content-Type': 'application/json'
            //     })
            // }).then(res => res.json())
            //     .then(response => {
            //     }).catch(error => {
            //     });
        }
    }

    OpenWebView(title = '', url = '') {
        this.props.navigation.navigate('OpenWebView', {
            title: title,
            url: url,
            transition: 'bottomUp'
        });
    }

    render() {
        const { navigate } = this.props.navigation;
        let subscribeList = [];
        this.state.subscribeList.forEach(function (item) {
            subscribeList.push(
                <View style={[Common.marginTop15, Common.flexRow, Common.alignItmCenter, Common.width100pr]}>
                    <Image style={[AppCommon.icon20, { tintColor: '#65CBEB' }]} source={require('../Images/check.png')}></Image>
                    <Text style={[Common.marginLeft10, AppCommon.h4, Colors.whiteFnColor]}>{item.name}</Text>
                </View>
            );
        }.bind(this));
        return (
            <View style={[AppCommon.mainContainer, Colors.whiteBgColor]}>
                <Notification screen='MasterQuantumSubView' />
                <LoaderSecond visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.whiteBgColor]}>
                </SafeAreaView> */}
                {Platform.OS == 'ios' ?
                    <StatusBar translucent backgroundColor={Colors.whiteBgColor} barStyle="light-content" />
                    : null}
                <LinearGradient
                    style={{ width: width, height: height }}
                    colors={['#6A7074', global.GRADIENT_BOTTOM_COLOR]}>
                    <View style={[global.FULL_DISPLAY ? Common.marginTop50 : Common.marginTop30, Common.flexRow, Common.alignItmCenter]}>
                        <TouchableHighlight
                            style={[Common.flex015, Common.justifyCenter, Common.alignItmCenter]}
                            underlayColor={global.TRANSPARENT_COLOR}
                            onPress={() => { this.backButtonClick() }}>
                            <Image style={[AppCommon.icon35]} source={require('../Images/close_3.png')} />
                        </TouchableHighlight>
                        <View style={[Common.flex07, Common.justifyCenter, Common.alignItmCenter]}>
                            <Text style={[AppCommon.h3, Colors.whiteFnColor, Input.textCenter, Input.textBold]}>Master Quantum</Text>
                        </View>
                        <View style={[Common.flex015, Common.justifyCenter, Common.alignItmCenter]}>
                        </View>
                    </View>
                    <ScrollView style={[]} alwaysBounceVertical={false} contentInsetAdjustmentBehavior="always" vertical={true} bounces={true}>
                        <NoInternet />
                        <View style={[AppCommon.container, Common.paddingHorizontal30]}>
                            <View style={[Common.marginTop10]}>
                                <Image style={[{ width: width - (global.IS_IPAD ? 50 : 30) - (global.IS_IPAD ? 50 : 30), height: width - (global.IS_IPAD ? 50 : 30) - (global.IS_IPAD ? 50 : 30), resizeMode: "contain" }]} source={require('../Images/MasterQuantum.png')} />
                            </View>
                            <View style={[Common.marginTop10, Common.marginHorizontal20, Common.justifyCenter, Common.alignItmCenter]}>
                                {subscribeList}
                            </View>
                            <View style={[Common.marginTop30, Common.justifyCenter, Common.alignItmCenter]}>
                                <TouchableHighlight
                                    onPress={() => { this.clickContinue() }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.height45, Common.width100pr, Common.justifyCenter, Common.alignItmCenter, Common.borderRadius25, Common.border2, Colors.whiteBorder, Colors.transparentBgColor]}>
                                    <Text style={[AppCommon.h4, Colors.whiteFnColor, Input.fontBold]}>Subscribe</Text>
                                </TouchableHighlight>
                            </View>
                            <View style={[Common.marginTop15, Common.justifyCenter, Common.alignItmCenter]}>
                                <Text style={[AppCommon.bodyFont, Colors.whiteFnColor, Input.textCenter, Input.textBold]}>Just {Platform.OS == 'ios' ? this.state.iOSPrice : this.state.androidPrice} per month</Text>
                            </View>
                            <View style={[Common.marginTop15, Common.justifyCenter, Common.alignItmCenter]}>
                                <Text style={[AppCommon.smallFont, Colors.whiteFnColor, Input.textCenter]}>This subscription automatically renews unless auto-renew is turned off at least 24-hours before current period ends. Payment is charged to your Apple ID account. Manage subscriptions and turn off auto renewal in Apple ID account settings.&nbsp;
                                    <Text
                                        onPress={() => { this.OpenWebView("Terms & Conditions", global.TERMS_CONDITIONS) }}
                                        style={[AppCommon.smallFont, Colors.whiteFnColor, Input.textCenter, Input.textBold, Input.textUnderline]}>
                                        Terms
                                    </Text>
                                    &nbsp;and&nbsp;
                                    <Text
                                        onPress={() => { this.OpenWebView("Privacy Policy", global.PRIVACY_POLICY) }}
                                        style={[AppCommon.smallFont, Colors.whiteFnColor, Input.textCenter, Input.textBold, Input.textUnderline]}>
                                        Privacy Policy
                                    </Text>
                                    .
                                </Text>
                            </View>
                            <View style={[Common.marginTop15, Common.justifyCenter, Common.alignItmCenter]}>
                                <TouchableHighlight
                                    onPress={() => { this.clickRestorePurchases() }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingHorizontal20, Common.height45, Common.justifyCenter, Common.alignItmCenter, Colors.transparentBgColor]}>
                                    <Text style={[AppCommon.h4, Colors.whiteFnColor, Input.fontBold]}>Restore Purchases</Text>
                                </TouchableHighlight>
                            </View>
                            <View style={[Common.marginTop10]}></View>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </View >
        );
    }
}

