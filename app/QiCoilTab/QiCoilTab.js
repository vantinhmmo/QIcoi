
import React, { Component } from 'react';
import { TouchableHighlight, Text, BackHandler, View, SafeAreaView, Image, FlatList, StatusBar, RefreshControl, Dimensions, Alert, TextInput, ScrollView, ImageBackground } from 'react-native';
import { AlphabetList } from "react-native-section-alphabet-list";
import AsyncStorage from '@react-native-community/async-storage';
import Frequency from 'react-native-frequency';
import LinearGradient from 'react-native-linear-gradient';

import Notification from '../Components/Notification';
import LoaderSecond from '../Components/LoaderSecond';
import NoInternet from '../Components/NoInternet';
import SmallPlayerView from '../Components/SmallPlayerView';
import ProgressImage from '../Lib/ProgressImage/ProgressImage';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

export default class QiCoilTab extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            listsRefresh: false,
            categoriesArray: [],
            subCategoriesArray: [],
            current_categories_id: '2',
            flatListData: [],
            keyword: '',
            showSearchView: false,
            searchDataArray: [],
        }
        this.showPlayerView = this.showPlayerView.bind(this);
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        this.getCategories();
        this.getSubCategories();
        // console.log("global.USER_DATA ==>", global.USER_DATA)
    }

    componentWillReceiveProps(nextProps) {
        this.getCategories(true);
        this.getSubCategories(true);
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
        this.setState({ foo })
        // this.getData();
    }

    getCategories(hideLoading = false) {
        if (hideLoading == false) {
            this.setState({ isLoading: true });
        }
        var query_string = ''
        query_string += "?user_id=" + global.USER_DATA.id;
        var url = encodeURI(GET_CATEGORIES + query_string);
        // console.log('getCategories ==>', url)
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.json())
            .then(response => {
                let resultArray = response['categories'];
                if (resultArray.length > 0) {
                    this.setState({
                        categoriesArray: resultArray,
                        current_categories_id: resultArray[1].id,
                        isLoading: false,
                        refreshList: false
                    }, () => {
                    });
                } else {
                    this.setState({ categoriesArray: [], isLoading: false, refreshList: false });
                }
            }).catch(error => {
                this.setState({ categoriesArray: [], isLoading: false, refreshList: false });
            });
    }

    getSubCategories(hideLoading = false) {
        if (hideLoading == false) {
            this.setState({ isLoading: true });
        }
        var query_string = ''
        query_string += "?user_id=" + global.USER_DATA.id;
        var url = encodeURI(GET_SUB_CATEGORIES + query_string);
        // console.log('getSubCategories ==>', url)
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.json())
            .then(response => {
                let resultArray = response['subcategories'];
                if (resultArray.length > 0) {
                    this.setState({
                        subCategoriesArray: resultArray,
                        isLoading: false,
                        refreshList: false
                    }, () => {
                        this.setFlatListData()
                    });
                } else {
                    this.setState({ subCategoriesArray: [], isLoading: false, refreshList: false });
                }
            }).catch(error => {
                this.setState({ subCategoriesArray: [], isLoading: false, refreshList: false });
            });
    }

    setFlatListData() {
        var flatListData = []
        this.state.subCategoriesArray.map((item, index) => {
            if (item.categoryId == this.state.current_categories_id) {
                flatListData.push(item)
            }
        })
        this.setState({ flatListData: flatListData });
    }

    renderItem = ({ item, index }) => {
        var viewWidth = (width - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15) - (global.IS_IPAD ? 20 : 15)) / 2
        var showLockImage = true
        if (item.is_free == '1') {
            showLockImage = false
        }
        return (
            <TouchableHighlight
                onPress={() => { this.openAlbumsList(item) }}
                underlayColor={global.TRANSPARENT_COLOR}
                style={[]}>
                <View style={[Common.marginLeft15, Common.marginTop15, Common.borderRadius10, Common.overflowHidden, Colors.lightGreyBgColor, { width: viewWidth }]}>
                    <ProgressImage
                        source={item.image ? { uri: item.image } : null}
                        style={[AppCommon.homeViewItemImage]}
                        imageStyle={[AppCommon.homeViewItemImage]}>
                        {showLockImage ?
                            <View style={[]}>
                                <Image source={require('../Images/lock.png')} style={[AppCommon.icon30, { tintColor: '#424244' }]} />
                            </View>
                            :
                            null}
                    </ProgressImage>
                </View>
            </TouchableHighlight>
        )
    }

    openAlbumsList(dataArray) {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            if (dataArray.is_free == '1') {
                this.props.navigation.navigate('AlbumsList', {
                    callType: 'QiCoilTab',
                    subCategoriesArray: dataArray,
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

    openSearchView() {
        this.setState({ showSearchView: true, }, () => {
            this.refs.txtSearch.focus()
        });
    }

    closeSearchView() {
        this.setState({ showSearchView: false, keyword: '', searchDataArray: [] }, () => {
            this.refs.txtSearch.blur()
        });
    }

    searchData() {
        this.setState({ isLoading: true });
        var query_string = ''
        query_string += "?keyword=" + this.state.keyword;
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
                        searchDataArray: resultArray,
                        isLoading: false,
                    }, () => {

                    });
                } else {
                    this.setState({ searchDataArray: [], isLoading: false });
                }
            }).catch(error => {
                this.setState({ searchDataArray: [], isLoading: false });
            });
    }

    openAlbumsDetails(dataArray) {
        this.props.navigation.navigate('AlbumsDetails', {
            callType: 'QiCoilTab',
            albumArray: dataArray,
            transition: 'bottomUp',
            onNavigateBack: this.handleOnNavigateBack.bind(this),
        });
    }

    render() {
        var categoriesView = []
        var searchView = []
        return (
            <View style={[AppCommon.mainContainer, Colors.lightBlackBgColor]}>
                <Notification screen='QiCoilTab' />
                <LoaderSecond visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.lightBlackBgColor]}>
                </SafeAreaView> */}
                {Platform.OS == 'ios' ?
                    <StatusBar translucent backgroundColor={Colors.lightBlackBgColor} barStyle="light-content" />
                    : null}
                <ImageBackground
                    source={require('../Images/TopBarBG.png')}
                    style={[AppCommon.qiCoilTopViewImage, Common.alignItmCenter]}
                    imageStyle={[AppCommon.qiCoilTopViewImage,]}>
                    <View style={[global.FULL_DISPLAY ? Common.marginTop50 : Common.marginTop30, Common.flexRow, Common.alignItmCenter, Common.marginHorizontal15, Common.paddingHorizontal10, Common.paddingVertical10, Common.borderRadius10, Colors.whiteBgColor]}>
                        <View style={[Common.justifyCenter]}>
                            <Image source={require('../Images/search.png')} style={[AppCommon.icon20, Colors.blackTnColor]} />
                        </View>
                        <View style={[Common.marginLeft10, Common.width90pr, Common.alignItmCenter, Common.justifySBetween]}>
                            <TextInput
                                style={[AppCommon.searchInput, Common.width90pr]}
                                ref='txtSearch'
                                keyboardType="default"
                                returnKeyType="default"
                                autoCapitalize='none'
                                placeholder="Search"
                                maxLength={250}
                                placeholderTextColor={global.BLACK_COLOR}
                                underlineColorAndroid={'transparent'}
                                onSubmitEditing={() => { }}
                                onChangeText={(keyword) => {
                                    if (keyword) {
                                        this.setState({ keyword: keyword }, () => {
                                            this.searchData()
                                        });
                                    } else {
                                        this.setState({ keyword: '', searchDataArray: [] });
                                    }
                                }}
                                value={this.state.keyword}
                                onFocus={() => { this.openSearchView() }}
                            />
                        </View>
                        <TouchableHighlight
                            onPress={() => { this.closeSearchView() }}
                            underlayColor={global.TRANSPARENT_COLOR}
                            style={this.state.showSearchView ? [Common.positionAbs, Common.right5, Common.padding5] : [Common.displayNone]}>
                            <Image source={require('../Images/close.png')} style={[AppCommon.icon20, Colors.blackTnColor]} />
                        </TouchableHighlight>
                    </View>
                    <View style={[Common.marginTop10, Common.flexRow, Common.alignItmCenter, Common.height40]}>
                        {/* <ScrollView
                            ref={(ref) => this.tiersScroll = ref}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            alwaysBounceHorizontal={false}
                            contentInsetAdjustmentBehavior="always"
                            bounces={true}
                            style={[Common.justifyCenter, Colors.redBgColor]}> */}
                        {this.state.categoriesArray && this.state.categoriesArray != undefined ?
                            this.state.categoriesArray.map((item, index) => {
                                var viewShow = true
                                if (item.id == '1') {
                                    viewShow = false
                                }
                                if (item.id == '4') {
                                    if (HIDE_INNER_CIRCLE_TIER == true) {
                                        viewShow = false
                                    }
                                }
                                if (viewShow) {
                                    categoriesView.push(
                                        <TouchableHighlight
                                            onPress={() => { this.setState({ current_categories_id: item.id }, () => { this.setFlatListData() }) }}
                                            underlayColor={global.TRANSPARENT_COLOR}
                                            style={[index == 1 ? Common.marginLeft15 : Common.marginLeft5, Common.paddingVertical5, Common.marginRight5]}>
                                            <View style={[]}>
                                                <Text style={[AppCommon.h4, Input.fontBold, this.state.current_categories_id == item.id ? Colors.whiteFnColor : Colors.drakGreyFnColor, { textTransform: 'uppercase' }]}>{item.name}</Text>
                                                {this.state.current_categories_id == item.id ?
                                                    <LinearGradient
                                                        start={{ x: 0.0, y: 0.50 }}
                                                        end={{ x: 1.3, y: 1.0 }}
                                                        style={[Common.marginTop5, { width: "100%", height: (global.IS_IPAD ? 5 : 3) }]}
                                                        colors={[global.GRADIENT_BOTTOM_COLOR, global.GRADIENT_RIGHT_COLOR,]}>
                                                    </LinearGradient>
                                                    :
                                                    <View style={[Common.marginTop5, { height: (global.IS_IPAD ? 5 : 3) }]}></View>
                                                }
                                            </View>
                                        </TouchableHighlight>
                                    );
                                }
                            })
                            :
                            null}
                        {categoriesView}
                        {/* </ScrollView> */}
                    </View>
                </ImageBackground>
                <NoInternet />
                <View style={this.state.showSearchView ? [Common.zIndex9, Common.positionAbs, Common.left0, Common.right0, Common.marginHorizontal15, Common.height250, Colors.whiteBgColor, { top: (global.IS_IPAD ? 100 : 100) }] : [Common.displayNone]}>
                    <ScrollView
                        ref={(ref) => this.searchScroll = ref}
                        vertical={true}
                        // showsVerticalScrollIndicator={false}
                        alwaysBounceVertical={false}
                        style={[]}>
                        {
                            this.state.searchDataArray.map((item, index) => {
                                searchView.push(
                                    <TouchableHighlight
                                        onPress={() => { this.openAlbumsDetails(item) }}
                                        underlayColor={global.TRANSPARENT_COLOR}
                                        style={[index == 0 ? Common.marginTop10 : Common.marginTop0, Common.marginBottom10, Common.marginHorizontal15]}>
                                        <Text style={[AppCommon.h4, Colors.blackFnColor]}>{item.title}</Text>
                                    </TouchableHighlight>
                                );
                            })
                        }
                        {searchView}
                    </ScrollView>
                </View>
                <FlatList
                    ref={ref => this.flatList = ref}
                    style={[]}
                    data={this.state.flatListData}
                    numColumns={2}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => index.toString()}
                />
                <View style={[Common.marginTop5]}></View>
                <SmallPlayerView screen='QiCoilTab' showPlayerView={this.showPlayerView} />
            </View >
        );
    }
}