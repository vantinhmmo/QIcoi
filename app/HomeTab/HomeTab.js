
import React, { Component } from 'react';
import { TouchableHighlight, Text, BackHandler, View, SafeAreaView, Image, ImageBackground, FlatList, StatusBar, RefreshControl, Dimensions, Alert, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import RNFetchBlob from 'rn-fetch-blob';
import Frequency from 'react-native-frequency';
import Modal from 'react-native-modal';
import analytics from '@react-native-firebase/analytics';

import Notification from '../Components/Notification';
import Loader from '../Components/Loader';
import NoInternet from '../Components/NoInternet';
import RateReview from '../Components/RateReview'
import SmallPlayerView from '../Components/SmallPlayerView';
import ProgressImage from '../Lib/ProgressImage/ProgressImage';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

export default class HomeTab extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            recentlyPlayedAlbumsArray: [],
            favoritesAlbumsArray: [],
            recentlyPlayedDataArray: [],
            favoritesDataArray: [],
            showRateReview: false,
        }
        this.showPlayerView = this.showPlayerView.bind(this);
        this.openRateReview = this.openRateReview.bind(this)
        this.closeRateReview = this.closeRateReview.bind(this)
        this.openHelpSupport = this.openHelpSupport.bind(this)
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        webFunctions.setSubcribe();
        global.TAB_INDEX = 0;
        this.setData()
        this.checkStoreRating()
        AsyncStorage.getItem('install_app_flag', (err, install_app_flag) => {
            if (install_app_flag == "0" || install_app_flag == null) {
                this.saveAnalyticsFirebase('Downloads', {});
                AsyncStorage.setItem('install_app_flag', JSON.stringify(1));
            }
        });
        // AsyncStorage.setItem('total_play_time', JSON.stringify(1800));
        AsyncStorage.getItem('total_play_time', (err, total_play_time) => {
            if (total_play_time == "0" || total_play_time == null || total_play_time == 'null') {
                global.TOTAL_PLAY_TIME = 0
            } else {
                global.TOTAL_PLAY_TIME = parseInt(total_play_time)
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        global.TAB_INDEX = 0;
        this.setData()
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
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
        this.setData()
    }

    checkStoreRating() {
        setTimeout(function () {
            AsyncStorage.getItem('rate_flag', (err, rate_flag) => {
                if (rate_flag == "0" || rate_flag == null || rate_flag == undefined) {
                    this.openRateReview()
                }
            });
        }.bind(this), 2000);

    }

    setData() {
        // AsyncStorage.setItem('recentlyPlayedAlbumsArray', '');
        AsyncStorage.getItem('recentlyPlayedAlbumsArray', (err, recentlyPlayedAlbumsArray) => {
            var oldPlayedAlbumsArray = JSON.parse(recentlyPlayedAlbumsArray)
            if (oldPlayedAlbumsArray != null && oldPlayedAlbumsArray != undefined) {
                this.setState({ recentlyPlayedAlbumsArray: oldPlayedAlbumsArray })
            }
        });
        // AsyncStorage.setItem('recentlyPlayedDataArray', '');
        AsyncStorage.getItem('recentlyPlayedDataArray', (err, recentlyPlayedDataArray) => {
            var oldPlayedDataArray = JSON.parse(recentlyPlayedDataArray)
            if (oldPlayedDataArray != null && oldPlayedDataArray != undefined) {
                this.setState({ recentlyPlayedDataArray: oldPlayedDataArray })
            }
        });
        this.getFavorites()
    }

    getFavorites() {
        var authorization = ""
        if (global.USER_DATA.token && global.USER_DATA.token != undefined) {
            authorization += "Bearer " + global.USER_DATA.token
        }
        var query_string = ''
        var url = encodeURI(GET_FAVORITE_PROGRAM + query_string);
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': authorization,
            })
        }).then(res => res.json())
            .then(response => {
                let favorite_frequencies = response['favorite'];
                if (favorite_frequencies.length > 0) {
                    global.FAVORITES_DATA = favorite_frequencies
                    this.setState({ favoritesDataArray: favorite_frequencies })
                } else {
                    global.FAVORITES_DATA = []
                    this.setState({ favoritesDataArray: [] });
                }
            }).catch(error => {
                global.FAVORITES_DATA = []
                this.setState({ favoritesDataArray: [], favoritesAlbumsArray: [] });
            });

        var authorization = ""
        if (global.USER_DATA.token && global.USER_DATA.token != undefined) {
            authorization += "Bearer " + global.USER_DATA.token
        }
        var query_string = ''
        var url = encodeURI(GET_FAVORITE_ALBUMS + query_string);
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': authorization,
            })
        }).then(res => res.json())
            .then(response => {
                let favorite_album = response['favorite'];
                if (favorite_album.length > 0) {
                    global.FAVORITES_ALBUMS = favorite_album
                    this.setState({ favoritesAlbumsArray: favorite_album })
                } else {
                    global.FAVORITES_ALBUMS = []
                    this.setState({ favoritesAlbumsArray: [] });
                }
            }).catch(error => {
                global.FAVORITES_ALBUMS = []
                this.setState({ favoritesDataArray: [], favoritesAlbumsArray: [] });
            });
    }

    async saveAnalyticsFirebase(eventName = '', dataArray = {}) {
        await analytics().logEvent(eventName, dataArray)
    }

    itemClick(dataArray) {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            if (global.IS_SUBSCRIBE == false) {
                if (global.USER_CREATED_DAYS > 7 && global.TOTAL_PLAY_TIME > 1799) {
                    this.props.navigation.navigate('SecondSubscribeView', { transition: 'bottomUp' });
                    return
                }
            }
            if (dataArray.frequencies && dataArray.frequencies != undefined) {
                if (global.IS_PLAY) {
                    global.IS_PLAY = false
                    global.PLAY_SUB_TITLE = ''
                    global.SMALL_VIEW_SHOW = false
                    global.SMALL_VIEW_IS_PLAY = false
                    global.SMALL_VIEW_TEXT = ''
                    Frequency.stop()
                    clearInterval(global.INTERVAL);
                }
                global.CURRENT_SECONDS = 0
                var frequenciesArray = dataArray.frequencies.split("/");
                this.props.navigation.navigate('PlayerView', {
                    callType: 'SelectItem',
                    id: dataArray.id,
                    title: dataArray.title,
                    strFrequencies: dataArray.frequencies,
                    playData: frequenciesArray,
                    transition: 'bottomUp',
                    onNavigateBack: this.handleOnNavigateBack.bind(this),
                });
            }
        } else {
            this.props.navigation.navigate('LandingView', { transition: 'bottomUp' });
        }
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

    openAlbumsDetails(dataArray) {
        if (dataArray.is_free == '1') {
            this.props.navigation.navigate('AlbumsDetails', {
                callType: 'AlbumsList',
                albumArray: dataArray,
                transition: 'bottomUp',
                onNavigateBack: this.handleOnNavigateBack.bind(this),
            });
        } else {
            if (dataArray.categoryId == '2') {
                this.props.navigation.navigate('MasterQuantumSubView', { transition: 'bottomUp' });
            } else if (dataArray.categoryId == '3') {
                this.props.navigation.navigate('HigherQuantumSubView', { transition: 'bottomUp' });
            }
        }
    }

    openRateReview() {
        this.setState({ showRateReview: true })
    }

    closeRateReview() {
        this.setState({ showRateReview: false })
    }

    openHelpSupport() {
        this.setState({ showRateReview: false }, () => {
            this.props.navigation.navigate('HelpSupport', { callType: 'HomeTab', transition: 'bottomUp' });
        })
    }

    render() {
        var name = ''
        if (global.USER_DATA.name && global.USER_DATA.name != undefined) {
            name = ', ' + global.USER_DATA.name
        }
        var recentlyPlayedAlbumsView = []
        if (this.state.recentlyPlayedAlbumsArray.length > 0) {
            this.state.recentlyPlayedAlbumsArray.forEach(function (item, index) {
                var viewWidth = (width - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15)) / 2.5
                var showLockImage = true
                if (item.is_free == '1') {
                    showLockImage = false
                }
                recentlyPlayedAlbumsView.push(
                    <TouchableHighlight
                        onPress={() => { this.openAlbumsDetails(item) }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={index == 0 ? [Common.marginLeft0] : [Common.marginLeft20]}>
                        <View style={[]}>
                            <View style={[Common.borderRadius10, Common.overflowHidden, Colors.lightGreyBgColor, { width: viewWidth }]}>
                                <ProgressImage
                                    source={item.image_path_256x256 ? { uri: item.image_path_256x256 } : require('../Images/album_default.png')}
                                    style={[AppCommon.recentlyPlayedAlbumsItemImage]}
                                    imageStyle={[AppCommon.recentlyPlayedAlbumsItemImage]}>
                                    {showLockImage ?
                                        <View style={[]}>
                                            <Image source={require('../Images/lock.png')} style={[AppCommon.icon40, { tintColor: '#424244' }]} />
                                        </View>
                                        :
                                        null}
                                </ProgressImage>
                                <View style={[Common.positionAbs, Common.left5, Common.bottom5]}>
                                    <Image style={[AppCommon.icon30]} source={require('../Images/Play_2.png')} />
                                </View>
                            </View>
                            <View style={[Common.marginTop10, { width: viewWidth }]}>
                                <Text style={[AppCommon.h5, Colors.whiteFnColor]}>{item.title}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                );
            }.bind(this));
        } else {
            recentlyPlayedAlbumsView.push(
                <View style={[Common.marginTop20, Common.alignItmCenter, Common.justifyCenter, { width: width }]}>
                    <Text style={[AppCommon.h4, Colors.whiteFnColor]}>No Recently Played Albums Found</Text>
                </View>
            );
        }
        var favoritesPlayedAlbumsView = []
        if (this.state.favoritesAlbumsArray.length > 0) {
            this.state.favoritesAlbumsArray.forEach(function (item, index) {
                var viewWidth = (width - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15)) / 2.5
                var showLockImage = true
                if (item.is_free == '1') {
                    showLockImage = false
                }
                favoritesPlayedAlbumsView.push(
                    <TouchableHighlight
                        onPress={() => { this.openAlbumsDetails(item) }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={index == 0 ? [Common.marginLeft0] : [Common.marginLeft20]}>
                        <View style={[]}>
                            <View style={[Common.borderRadius10, Common.overflowHidden, Colors.lightGreyBgColor, { width: viewWidth }]}>
                                <ProgressImage
                                    source={item.image_path_256x256 ? { uri: item.image_path_256x256 } : require('../Images/album_default.png')}
                                    style={[AppCommon.recentlyPlayedAlbumsItemImage]}
                                    imageStyle={[AppCommon.recentlyPlayedAlbumsItemImage]}>
                                    {showLockImage ?
                                        <View style={[]}>
                                            <Image source={require('../Images/lock.png')} style={[AppCommon.icon40, { tintColor: '#424244' }]} />
                                        </View>
                                        :
                                        null}
                                </ProgressImage>
                                <View style={[Common.positionAbs, Common.left5, Common.bottom5]}>
                                    <Image style={[AppCommon.icon30]} source={require('../Images/Play_2.png')} />
                                </View>
                            </View>
                            <View style={[Common.marginTop10, { width: viewWidth }]}>
                                <Text style={[AppCommon.h5, Colors.whiteFnColor]}>{item.title}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                );
            }.bind(this));
        } else {
            favoritesPlayedAlbumsView.push(
                <View style={[Common.marginTop20, Common.alignItmCenter, Common.justifyCenter, { width: width }]}>
                    <Text style={[AppCommon.h4, Colors.whiteFnColor]}>No Favorites Albums Found</Text>
                </View>
            );
        }
        var recentlyPlayedDataView = []
        if (this.state.recentlyPlayedDataArray.length > 0) {
            this.state.recentlyPlayedDataArray.forEach(function (item) {
                recentlyPlayedDataView.push(
                    <TouchableHighlight
                        onPress={() => { this.itemClick(item); }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop15]}>
                        <View style={[Common.flexRow, Common.alignItmCenter]}>
                            <View style={[]}>
                                <Image style={[AppCommon.icon30]} source={require('../Images/Play_2.png')} />
                            </View>
                            <View style={[Common.marginLeft10]}>
                                <Text style={[AppCommon.h5, Colors.whiteFnColor]}>{item.title}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                );
            }.bind(this));
        } else {
            recentlyPlayedDataView.push(
                <View style={[Common.marginTop20, Common.alignItmCenter]}>
                    <Text style={[AppCommon.h4, Colors.whiteFnColor]}>No Recently Played Found</Text>
                </View>
            );
        }
        var favoritesPlayedDataView = []
        if (this.state.favoritesDataArray.length > 0) {
            this.state.favoritesDataArray.forEach(function (item) {
                favoritesPlayedDataView.push(
                    <TouchableHighlight
                        onPress={() => { this.itemClick(item); }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.marginTop15]}>
                        <View style={[Common.flexRow, Common.alignItmCenter]}>
                            <View style={[]}>
                                <Image style={[AppCommon.icon30]} source={require('../Images/Play_2.png')} />
                            </View>
                            <View style={[Common.marginLeft10]}>
                                <Text style={[AppCommon.h5, Colors.whiteFnColor]}>{item.title}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                );
            }.bind(this));
        } else {
            favoritesPlayedDataView.push(
                <View style={[Common.marginTop20, Common.alignItmCenter]}>
                    <Text style={[AppCommon.h4, Colors.whiteFnColor]}>No Favorites Found</Text>
                </View>
            );
        }
        return (
            <View style={[AppCommon.mainContainer, Colors.lightBlackBgColor]}>
                <Notification screen='HomeTab' />
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
                        <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Good Morning{name}</Text>
                    </View>
                </ImageBackground>
                <NoInternet />
                <ScrollView style={[{ width: width }]} alwaysBounceVertical={false} contentInsetAdjustmentBehavior="always" vertical={true} bounces={true}>
                    <View style={[Common.marginTop15, Common.marginHorizontal15]}>
                        <View style={[]}>
                            <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Recently Played</Text>
                        </View>
                        <View style={[Common.marginTop20, Common.flexRow, Common.alignItmCenter]}>
                            <ScrollView
                                ref={(ref) => this.tiersScroll = ref}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                alwaysBounceHorizontal={false}
                                contentInsetAdjustmentBehavior="always"
                                bounces={true}
                                style={[]}>
                                {recentlyPlayedAlbumsView}
                            </ScrollView>
                        </View>
                    </View>
                    <View style={[Common.marginTop40, Common.marginHorizontal15]}>
                        <View style={[]}>
                            <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Favorites</Text>
                        </View>
                        <View style={[Common.marginTop20, Common.flexRow, Common.alignItmCenter]}>
                            <ScrollView
                                ref={(ref) => this.tiersScroll = ref}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                alwaysBounceHorizontal={false}
                                contentInsetAdjustmentBehavior="always"
                                bounces={true}
                                style={[]}>
                                {favoritesPlayedAlbumsView}
                            </ScrollView>
                        </View>
                    </View>
                    <View style={[Common.marginTop40, Common.marginHorizontal15]}>
                        <View style={[]}>
                            <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Recently Played</Text>
                        </View>
                        <View style={[]}>
                            {recentlyPlayedDataView}
                        </View>
                    </View>
                    <View style={[Common.marginTop40, Common.marginHorizontal15]}>
                        <View style={[]}>
                            <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>Favorites</Text>
                        </View>
                        <View style={[]}>
                            {favoritesPlayedDataView}
                        </View>
                    </View>
                    <View style={[Common.marginTop20]}></View>
                    <SmallPlayerView screen='HomeTab' showPlayerView={this.showPlayerView} />
                </ScrollView>
                <Modal
                    backdropOpacity={0.5}
                    animationIn={"zoomIn"}
                    animationOut={"zoomOut"}
                    onBackButtonPress={() => { this.closeRateReview() }}
                    onBackdropPress={() => { this.closeRateReview() }}
                    isVisible={this.state.showRateReview}
                    style={[Common.margin0, Common.justifyCenter, Common.alignItmCenter]}>
                    <RateReview
                        closeRateReview={() => { this.closeRateReview() }}
                        openHelpSupport={() => { this.openHelpSupport() }}
                    />
                </Modal>
            </View >
        );
    }
}