import React, { Component } from 'react';
import { TouchableHighlight, Text, View, SafeAreaView, Image, FlatList, StatusBar, NativeModules, RefreshControl, Dimensions, Alert, Platform, ScrollView, Linking, AppState, TextInput, ImageBackground, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import RNFetchBlob from 'rn-fetch-blob';

import Notification from '../Components/Notification';
import NoInternet from '../Components/NoInternet';
import LoaderSecond from '../Components/LoaderSecond';
import SmallPlayerView from '../Components/SmallPlayerView';
import ProgressImage from '../Lib/ProgressImage/ProgressImage';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

export default class AlbumsList extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            callType: '',
            subCategoriesArray: [],
            albumsArray: [],
        }
        this.showPlayerView = this.showPlayerView.bind(this);
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        let callType = this.props.navigation.getParam('callType', '');
        let subCategoriesArray = this.props.navigation.getParam('subCategoriesArray', []);
        this.setState({
            callType: callType,
            subCategoriesArray: subCategoriesArray,
        }, () => {
            this.getAlbumsData()
        });
    }

    componentWillReceiveProps(nextProps) {
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    }

    handleBackButton = () => {
        this.backButtonClick()
        return true;
    }

    backButtonClick() {
        this.props.navigation.state.params.onNavigateBack(true)
        this.props.navigation.goBack()
    }

    handleOnNavigateBack = (foo) => {
        this.setState({ foo })
    }

    getAlbumsData() {
        this.setState({ isLoading: true });
        var query_string = ''
        query_string += "?category=" + this.state.subCategoriesArray.categoryId;
        query_string += "&subcategory=" + this.state.subCategoriesArray.id;
        query_string += "&user_id=" + global.USER_DATA.id;
        var url = encodeURI(GET_ALBUMS + query_string);
        // console.log('getAlbumsData ==>', url)
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.json())
            .then(response => {
                let resultArray = response['album'];
                if (resultArray.length > 0) {
                    this.setState({
                        albumsArray: resultArray,
                        isLoading: false,
                        refreshList: false
                    }, () => {

                    });
                } else {
                    this.setState({ albumsArray: [], isLoading: false, refreshList: false });
                }
            }).catch(error => {
                this.setState({ albumsArray: [], isLoading: false, refreshList: false });
            });
    }

    renderItem = ({ item, index }) => {
        var viewWidth = (width - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15)) / 2
        var showLockImage = true
        if (item.is_free == '1') {
            showLockImage = false
        }
        return (
            <TouchableHighlight
                onPress={() => { this.openAlbumsDetails(item) }}
                underlayColor={global.TRANSPARENT_COLOR}
                style={[]}>
                <View style={[Common.marginLeft15, Common.marginTop15, Common.borderRadius10, Common.overflowHidden, Colors.lightGreyBgColor, { width: viewWidth }]}>
                    <ProgressImage
                        source={item.image_path_256x256 ? { uri: item.image_path_256x256 } : require('../Images/album_default.png')}
                        style={[AppCommon.albumsListItemImage]}
                        imageStyle={[AppCommon.albumsListItemImage]}>
                        {showLockImage ?
                            <View style={[]}>
                                <Image source={require('../Images/lock.png')} style={[AppCommon.icon40, { tintColor: '#424244' }]} />
                            </View>
                            :
                            null}
                    </ProgressImage>
                </View>
            </TouchableHighlight>
        )
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
        const { navigate } = this.props.navigation;
        return (
            <View style={[AppCommon.mainContainer, Colors.lightBlackBgColor]}>
                <Notification screen='AlbumsList' />
                <LoaderSecond visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.lightBlackBgColor]}>
                </SafeAreaView> */}
                {Platform.OS == 'ios' ?
                    <StatusBar translucent backgroundColor={[Colors.lightBlackBgColor]} barStyle="light-content" />
                    : null}
                <ImageBackground
                    source={require('../Images/TopBarBG.png')}
                    style={[AppCommon.albumsListTopViewImage]}
                    imageStyle={[AppCommon.albumsListTopViewImage,]}>
                    <View style={[global.FULL_DISPLAY ? Common.marginTop60 : Common.marginTop40, Common.marginHorizontal20]}>
                        <TouchableHighlight
                            onPress={() => { this.backButtonClick() }}
                            underlayColor={global.TRANSPARENT_COLOR}
                            style={[Common.zIndex9, Common.flex01, Common.flexRow, Common.justifyFStart, Common.alignItmFStart]}>
                            <View style={[Common.flexRow, Common.justifyFStart, Common.alignItmCenter]}>
                                <Image style={[AppCommon.icon20, Colors.whiteTnColor]} source={require('../Images/left_arrow.png')} />
                            </View>
                        </TouchableHighlight>
                        <View style={[AppCommon.topBarTitle]}>
                            <Text style={[AppCommon.h3, Colors.whiteFnColor, Input.fontBold]}>{this.state.subCategoriesArray.name}</Text>
                        </View>
                    </View>
                </ImageBackground>
                <NoInternet />
                <FlatList
                    ref={ref => this.flatList = ref}
                    style={[]}
                    data={this.state.albumsArray}
                    numColumns={2}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => index.toString()}
                />
                <View style={[Common.marginTop20]}></View>
                <View style={global.SMALL_VIEW_SHOW ? [Common.marginTop60] : []}></View>
                <SmallPlayerView screen='AlbumsList' showPlayerView={this.showPlayerView} />
            </View>
        );
    }
}

