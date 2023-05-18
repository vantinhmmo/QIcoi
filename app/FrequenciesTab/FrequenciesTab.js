
import React, { Component } from 'react';
import { TouchableHighlight, Text, BackHandler, View, SafeAreaView, Image, FlatList, ImageBackground, StatusBar, RefreshControl, Dimensions, Alert, TextInput, ScrollView } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Frequency from 'react-native-frequency';
import LinearGradient from 'react-native-linear-gradient';
import { AlphabetList } from "react-native-section-alphabet-list";
import AsyncStorage from '@react-native-community/async-storage';

import Notification from '../Components/Notification';
import Loader from '../Components/Loader';
import LoaderSecond from '../Components/LoaderSecond';
import NoInternet from '../Components/NoInternet';
import ProgressImage from '../Lib/ProgressImage/ProgressImage';
import SmallPlayerView from '../Components/SmallPlayerView';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

export default class FrequenciesTab extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            showView: 'SearchTab',  // SearchTab // FrequenciesTab 
            listsRefresh: false,
            keyword: '',
            frequenciesArray: [],
            recentlySearchesDataArray: [],
            selectLetter: '#',
            groupby: '',
            selectedFrequenciesType: 1,
            frequenciesValue: 284.95,
            firstSelectValue: 284,
            firstSliderValueMin: 5,
            firstSliderValueMix: 28000,
            secondSliderValueMin: 279.95,
            secondSliderValueMix: 289.95,
            isPlay: false,
            selectRange: 'All', // All || 5-500 hz || 500-1k || 1k-3k || 3k-11k || 11k-28k
        }
        this.offset = 1;
        this.onEndReachedCalledDuringMomentum = false;
        this.showPlayerView = this.showPlayerView.bind(this);
        this.sliderValuesChange = this.sliderValuesChange.bind(this)
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        this.setState({ showView: 'SearchTab', selectLetter: '#', groupby: '', keyword: '', isPlay: global.FREQUENCIES_TAB_IS_PLAY }, () => {
            this.getRecentlySearches()
            this.getFrequencies();
            this.getFavorites()
        })
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ showView: 'SearchTab', selectLetter: '#', groupby: '', keyword: '', isPlay: global.FREQUENCIES_TAB_IS_PLAY }, () => {
            this.getRecentlySearches()
            this.getFrequencies(1, true);
            this.getFavorites()
        })
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
        this.getRecentlySearches()
        // this.getFrequencies();
        this.getFavorites()
    }

    getRecentlySearches() {
        AsyncStorage.getItem('recentlySearchesDataArray', (err, recentlySearchesDataArray) => {
            var oldSearchesDataArray = JSON.parse(recentlySearchesDataArray)
            if (oldSearchesDataArray != null && oldSearchesDataArray != undefined) {
                this.setState({ recentlySearchesDataArray: oldSearchesDataArray })
            } else {
                this.setState({ recentlySearchesDataArray: [] })
            }
        });
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
                let resultArray = response['favorite'];
                if (resultArray.length > 0) {
                    global.FAVORITES_DATA = resultArray
                    this.setState({ favoritesDataArray: resultArray })
                } else {
                    global.FAVORITES_DATA = []
                    this.setState({ favoritesDataArray: [] });
                }
            }).catch(error => {
                global.FAVORITES_DATA = []
                this.setState({ favoritesDataArray: [] });
            });
    }

    searchItemClick(dataArray) {
        this.openPlayerView(dataArray.id, dataArray.title, dataArray.frequencies)
    }

    clearClick() {
        AsyncStorage.setItem('recentlySearchesDataArray', '', () => {
            this.getRecentlySearches()
        });
    }

    getFrequencies(page = 1, hideLoading = false) {
        if (hideLoading == false) {
            this.setState({ isLoading: true });
        }
        var query_string = ''
        query_string += "?page_no=" + page;
        query_string += "&keyword=" + this.state.keyword;
        query_string += "&groupby=" + this.state.groupby;
        query_string += "&category=1";
        var url = encodeURI(GET_FREQUENCIES + query_string);
        // console.log('getFrequencies ==>', url)
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.json())
            .then(response => {
                let resultArray = response['frequencies'];
                if (resultArray.length > 0) {
                    this.offset = page + 1;
                    if (page == 1) {
                        this.setState({
                            frequenciesArray: resultArray,
                            isLoading: false,
                            refreshList: false
                        }, () => {

                        });
                    } else {
                        this.setState(state => ({
                            frequenciesArray: [...state.frequenciesArray, ...resultArray],
                            isLoading: false,
                            listsRefresh: false
                        }));
                    }
                } else {
                    if (page == 1) {
                        this.setState({ frequenciesArray: [], isLoading: false, refreshList: false });
                    } else {
                        this.setState({ isLoading: false, refreshList: false });
                    }
                }
            }).catch(error => {
                this.setState({ frequenciesArray: [], isLoading: false, refreshList: false });
            });
    }

    renderItem = ({ item, index }) => {
        return (
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
    }

    itemClick(dataArray) {
        if (this.state.keyword) {
            AsyncStorage.getItem('recentlySearchesDataArray', (err, recentlySearchesDataArray) => {
                var oldSearchesDataArray = JSON.parse(recentlySearchesDataArray)
                var tempDataArray = []
                if (oldSearchesDataArray != null && oldSearchesDataArray != undefined) {
                    var item = []
                    var checkFlag = 0
                    oldSearchesDataArray = oldSearchesDataArray.reverse()
                    for (var i = 0; i < oldSearchesDataArray.length; ++i) {
                        if (i < 4) {
                            item = oldSearchesDataArray[i];
                            if (item.id == dataArray.id) {
                                checkFlag = 1
                            } else if (i > oldSearchesDataArray.length - 4) {
                                tempDataArray = [{ 'id': item.id, 'title': item.title, 'frequencies': item.frequencies }, ...tempDataArray];
                            }
                        }
                    }
                    if (checkFlag == 0) {
                        tempDataArray = [{ 'id': dataArray.id, 'title': dataArray.title, 'frequencies': dataArray.frequencies }, ...tempDataArray];
                        AsyncStorage.setItem('recentlySearchesDataArray', JSON.stringify(tempDataArray), () => {
                            this.openPlayerView(dataArray.id, dataArray.title, dataArray.frequencies)
                        });
                    } else {
                        this.openPlayerView(dataArray.id, dataArray.title, dataArray.frequencies)
                    }
                } else {
                    tempDataArray.push({ 'id': dataArray.id, 'title': dataArray.title, 'frequencies': dataArray.frequencies })
                    AsyncStorage.setItem('recentlySearchesDataArray', JSON.stringify(tempDataArray), () => {
                        this.openPlayerView(dataArray.id, dataArray.title, dataArray.frequencies)
                    });
                }
            });
        } else {
            this.openPlayerView(dataArray.id, dataArray.title, dataArray.frequencies)
        }
    }

    openPlayerView(id, title, strFrequencies = '') {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            if (global.IS_SUBSCRIBE == false) {
                if (global.USER_CREATED_DAYS > 7 && global.TOTAL_PLAY_TIME > 1799) {
                    this.props.navigation.navigate('SecondSubscribeView', { transition: 'bottomUp' });
                    return
                }
            }
            if (strFrequencies && strFrequencies != undefined) {
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
                var frequenciesArray = strFrequencies.split("/");
                this.props.navigation.navigate('PlayerView', {
                    callType: 'SelectItem',
                    id: id,
                    title: title,
                    strFrequencies: strFrequencies,
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

    handleEnd = () => {
        if (!this.onEndReachedCalledDuringMomentum) {
            this.getFrequencies(this.offset);
            this.onEndReachedCalledDuringMomentum = true;
        }
    }

    refreshList() {
        this.offset = 1;
        this.setState({ refreshList: true, frequenciesArray: [] }, () => {
            this.getFrequencies(1);
        });
        this.setState({ refreshList: false });
    }

    ListEmptyView = () => {
        return (
            <View style={[Common.marginTop10, Common.paddingHorizontal30, Common.flex1, Common.flexColumn, Common.justifyCenter, Common.alignItmCenter]}>
                <Text style={[AppCommon.h4, Colors.whiteFnColor]}>No Frequencies Found</Text>
            </View>
        );
    }

    alphabetItemClick(letter) {
        var groupby = ''
        if (letter != '#') {
            groupby = letter
        }
        this.setState({ selectLetter: letter, groupby: groupby }, () => {
            this.getFrequencies()
        });
    }

    sliderRangeChange(callType) {
        this.stopFrequency()
        if (callType == 'All') {
            this.setState({
                selectRange: callType,
                frequenciesValue: 284.95,
                firstSelectValue: 284,
                firstSliderValueMin: 5,
                firstSliderValueMix: 28001,
                secondSliderValueMin: 279.95,
                secondSliderValueMix: 289.95,
            });
        } else if (callType == '5-500 hz') {
            this.setState({
                selectRange: callType,
                frequenciesValue: 252.50,
                firstSelectValue: 252,
                firstSliderValueMin: 5,
                firstSliderValueMix: 501,
                secondSliderValueMin: 247.50,
                secondSliderValueMix: 257.50,
            });
        } else if (callType == '500-1k') {
            this.setState({
                selectRange: callType,
                frequenciesValue: 750.00,
                firstSelectValue: 750,
                firstSliderValueMin: 500,
                firstSliderValueMix: 1001,
                secondSliderValueMin: 745.00,
                secondSliderValueMix: 755.00,
            });
        } else if (callType == '1k-3k') {
            this.setState({
                selectRange: callType,
                frequenciesValue: 2000.00,
                firstSelectValue: 2000,
                firstSliderValueMin: 1000,
                firstSliderValueMix: 3001,
                secondSliderValueMin: 1995.00,
                secondSliderValueMix: 2005.00,
            });;
        } else if (callType == '3k-11k') {
            this.setState({
                selectRange: callType,
                frequenciesValue: 7000.00,
                firstSelectValue: 7000,
                firstSliderValueMin: 3000,
                firstSliderValueMix: 11001,
                secondSliderValueMin: 6995.00,
                secondSliderValueMix: 7005.00,
            });
        } else if (callType == '11k-28k') {
            this.setState({
                selectRange: callType,
                frequenciesValue: 19500.00,
                firstSelectValue: 19500,
                firstSliderValueMin: 11000,
                firstSliderValueMix: 28001,
                secondSliderValueMin: 19495.00,
                secondSliderValueMix: 19505.00,
            });
        }
    }

    frequenciesValuesChange(callType) {
        this.stopFrequency()
        var frequenciesValue = this.state.frequenciesValue
        var secondSliderValueMin = 0.00
        var secondSliderValueMix = 0.00
        if (this.state.selectRange == 'All') {
            if (callType == 'plus') {
                frequenciesValue = frequenciesValue + 279.95
            } else if (callType == 'minus') {
                frequenciesValue = frequenciesValue - 279.95
            }
            if (frequenciesValue < 5) {
                frequenciesValue = 5.00
            } else if (frequenciesValue > 28000) {
                frequenciesValue = 28000.00
            }
        } else if (this.state.selectRange == '5-500 hz') {
            if (callType == 'plus') {
                frequenciesValue = frequenciesValue + 4.95
            } else if (callType == 'minus') {
                frequenciesValue = frequenciesValue - 4.95
            }
            if (frequenciesValue < 5) {
                frequenciesValue = 5.00
            } else if (frequenciesValue > 500) {
                frequenciesValue = 500.00
            }
        } else if (this.state.selectRange == '500-1k') {
            if (callType == 'plus') {
                frequenciesValue = frequenciesValue + 5
            } else if (callType == 'minus') {
                frequenciesValue = frequenciesValue - 5
            }
            if (frequenciesValue < 500) {
                frequenciesValue = 500.00
            } else if (frequenciesValue > 1000) {
                frequenciesValue = 1000.00
            }
        } else if (this.state.selectRange == '1k-3k') {
            if (callType == 'plus') {
                frequenciesValue = frequenciesValue + 20
            } else if (callType == 'minus') {
                frequenciesValue = frequenciesValue - 20
            }
            if (frequenciesValue < 1000) {
                frequenciesValue = 1000.00
            } else if (frequenciesValue > 3000) {
                frequenciesValue = 3000.00
            }
        } else if (this.state.selectRange == '3k-11k') {
            if (callType == 'plus') {
                frequenciesValue = frequenciesValue + 80
            } else if (callType == 'minus') {
                frequenciesValue = frequenciesValue - 80
            }
            if (frequenciesValue < 3000) {
                frequenciesValue = 3000.00
            } else if (frequenciesValue > 11000) {
                frequenciesValue = 11000.00
            }
        } else if (this.state.selectRange == '11k-28k') {
            if (callType == 'plus') {
                frequenciesValue = frequenciesValue + 170
            } else if (callType == 'minus') {
                frequenciesValue = frequenciesValue - 170
            }
            if (frequenciesValue < 11000) {
                frequenciesValue = 11000.00
            } else if (frequenciesValue > 28000) {
                frequenciesValue = 28000.00
            }
        }
        let strFrequenciesValue = frequenciesValue.toFixed(2)
        strArray = strFrequenciesValue.split(".");
        firstSelectValue = parseFloat(strArray[0])
        secondSliderValueMin = frequenciesValue - 5
        secondSliderValueMix = frequenciesValue + 5
        this.setState({
            frequenciesValue: frequenciesValue,
            firstSelectValue: firstSelectValue,
            secondSliderValueMin: secondSliderValueMin,
            secondSliderValueMix: secondSliderValueMix,
        });
    }

    sliderValuesChange(callType, value) {
        this.stopFrequency()
        var frequenciesValue = 0.00
        var firstSelectValue = 0.00
        var secondSliderValueMin = 0.00
        var secondSliderValueMix = 0.00
        var tempFirstSelectValue = 0
        var tempSecondSelectValue = 0
        var tempArray
        if (callType == 'first') {
            if (parseFloat(value) >= 28000) {
                firstSelectValue = 28000
                tempSecondSelectValue = 0
            } else {
                firstSelectValue = parseFloat(value)
                tempArray = this.state.frequenciesValue.toString().split(".");
                if (tempArray.length > 1) {
                    tempSecondSelectValue = parseFloat(tempArray[1] / 100)
                }
                tempSecondSelectValue = 0
            }
            frequenciesValue = firstSelectValue + tempSecondSelectValue
            secondSliderValueMin = frequenciesValue - 5
            secondSliderValueMix = frequenciesValue + 5
        } else {
            if (parseFloat(value) >= 28000) {
                firstSelectValue = 28000
                frequenciesValue = 28000.00
                secondSliderValueMin = 27995.00 - 5
                secondSliderValueMix = 28005.00 + 5
            } else {
                tempArray = value.toString().split(".");
                tempFirstSelectValue = parseFloat(tempArray[0])
                firstSelectValue = tempFirstSelectValue
                frequenciesValue = parseFloat(value)
                secondSliderValueMin = parseFloat(value) - 5
                secondSliderValueMix = parseFloat(value) + 5
            }

        }
        this.setState({
            frequenciesValue: frequenciesValue,
            firstSelectValue: firstSelectValue,
            secondSliderValueMin: secondSliderValueMin,
            secondSliderValueMix: secondSliderValueMix,
        });
    }

    playClick() {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            if (global.IS_SUBSCRIBE == false) {
                if (global.USER_CREATED_DAYS > 7 && global.TOTAL_PLAY_TIME > 1799) {
                    this.props.navigation.navigate('SecondSubscribeView', { transition: 'bottomUp' });
                    return
                }
            }
        }
        if (this.state.isPlay) {
            this.stopFrequency()
        } else {
            Frequency.playFrequency(parseFloat(this.state.frequenciesValue), 180)
                .then(response => {
                    // console.log("response ==>", response)
                    // 60000
                    global.FREQUENCIES_TAB_IS_PLAY = false
                    this.setState({ isPlay: false });
                })
                .catch(error => {
                    // console.log("error ==>", error)
                });
            global.PLAYER_USED = 0
            if (global.PLAY_SOUND != null) {
                global.PLAY_SOUND.stop()
                global.PLAY_SOUND = null
            }
            if (global.IS_PLAY) {
                global.IS_PLAY = false
                global.PLAY_SUB_TITLE = ''
                global.SMALL_VIEW_SHOW = false
                global.SMALL_VIEW_IS_PLAY = false
                global.SMALL_VIEW_TEXT = ''
                clearInterval(global.INTERVAL);
            }
            global.FREQUENCIES_TAB_IS_PLAY = true
            this.setState({ isPlay: true });
        }

    }

    stopFrequency() {
        if (this.state.isPlay) {
            Frequency.stop()
            global.FREQUENCIES_TAB_IS_PLAY = false
            this.setState({ isPlay: false });
        }
    }

    changeShowView(showView) {
        this.setState({ showView: showView });
    }

    render() {
        if (this.state.showView == 'SearchTab') {
            var recentlySearchesDataView = []
            if (this.state.recentlySearchesDataArray.length > 0) {
                this.state.recentlySearchesDataArray.forEach(function (item) {
                    recentlySearchesDataView.push(
                        <TouchableHighlight
                            onPress={() => { this.searchItemClick(item); }}
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
                recentlySearchesDataView.push(
                    <View style={[Common.paddingVertical25, Common.alignItmCenter]}>
                        <Text style={[AppCommon.h4, Colors.whiteFnColor]}>No Recently Searches Found</Text>
                    </View>
                );
            }
            var alphabetTop = 0
            var alphabetHeight = 0
            if (global.FULL_DISPLAY) {
                alphabetTop = global.Gap_50 + global.Gap_50 + global.Gap_50 + global.Gap_20
                alphabetHeight = height - alphabetTop - global.Tab_Bar_Height - global.Gap_40 - global.Gap_20
            } else {
                alphabetTop = global.Gap_50 + global.Gap_50 + global.Gap_40 + global.Gap_20
                alphabetHeight = height - alphabetTop - global.Tab_Bar_Height - global.Gap_10 - global.Gap_20
            }
            var alphabetView = []
            var alphabet = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            var alphabetLetterViewhHeight = alphabetHeight / 27
            alphabet.forEach(function (letter, index) {
                alphabetView.push(
                    <TouchableHighlight
                        onPress={() => { this.alphabetItemClick(letter); }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.paddingHorizontal5, Common.justifyCenter, Common.alignItmCenter, { height: alphabetLetterViewhHeight }]}>
                        <Text style={[AppCommon.h5, this.state.selectLetter == letter ? Colors.defaultFnColor : Colors.whiteFnColor]}>{letter}</Text>
                    </TouchableHighlight>
                );
            }.bind(this));
            return (
                <View style={[AppCommon.mainContainer, Colors.lightBlackBgColor]}>
                    <Notification screen='SearchTab' />
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
                                    style={[AppCommon.searchInput, Common.width95pr]}
                                    ref='txtSearch'
                                    keyboardType="default"
                                    returnKeyType="go"
                                    autoCapitalize='none'
                                    placeholder="Search"
                                    maxLength={250}
                                    placeholderTextColor={global.BLACK_COLOR}
                                    underlineColorAndroid={'transparent'}
                                    onSubmitEditing={() => { }}
                                    onChangeText={(keyword) => {
                                        this.setState({ keyword: keyword }, () => {
                                            this.getFrequencies()
                                        })
                                    }}
                                    value={this.state.keyword}
                                />
                            </View>
                        </View>
                        <View style={[Platform.OS == 'ios' ? Common.marginTop10 : Common.marginTop5, Common.flexRow, Common.justifyCenter, Common.alignItmCenter, Common.height40]}>
                            <TouchableHighlight
                                onPress={() => { this.changeShowView('SearchTab') }}
                                underlayColor={global.TRANSPARENT_COLOR}
                                style={[Common.paddingVertical5, Common.marginRight5]}>
                                <View style={[Common.alignItmCenter]}>
                                    <Text style={[AppCommon.h4, Input.fontBold, this.state.showView == 'SearchTab' ? Colors.whiteFnColor : Colors.drakGreyFnColor]}>PROGRAMS</Text>
                                    {this.state.showView == 'SearchTab' ?
                                        <LinearGradient
                                            start={{ x: 0.0, y: 0.50 }}
                                            end={{ x: 1.3, y: 1.0 }}
                                            style={[Common.marginTop5, { width: "60%", height: (global.IS_IPAD ? 5 : 3) }]}
                                            colors={[global.GRADIENT_BOTTOM_COLOR, global.GRADIENT_RIGHT_COLOR,]}>
                                        </LinearGradient>
                                        :
                                        <View style={[Common.marginTop5, { height: (global.IS_IPAD ? 5 : 3) }]}></View>
                                    }
                                </View>
                            </TouchableHighlight>
                            <TouchableHighlight
                                onPress={() => { this.changeShowView('FrequenciesTab') }}
                                underlayColor={global.TRANSPARENT_COLOR}
                                style={[Common.marginLeft30, Common.paddingVertical5, Common.marginRight5]}>
                                <View style={[Common.alignItmCenter]}>
                                    <Text style={[AppCommon.h4, Input.fontBold, this.state.showView == 'FrequenciesTab' ? Colors.whiteFnColor : Colors.drakGreyFnColor]}>FREQUENCIES</Text>
                                    {this.state.showView == 'FrequenciesTab' ?
                                        <LinearGradient
                                            start={{ x: 0.0, y: 0.50 }}
                                            end={{ x: 1.3, y: 1.0 }}
                                            style={[Common.marginTop5, { width: "60%", height: (global.IS_IPAD ? 5 : 3) }]}
                                            colors={[global.GRADIENT_BOTTOM_COLOR, global.GRADIENT_RIGHT_COLOR,]}>
                                        </LinearGradient>
                                        :
                                        <View style={[Common.marginTop5, { height: (global.IS_IPAD ? 5 : 3) }]}></View>
                                    }
                                </View>
                            </TouchableHighlight>
                        </View>
                    </ImageBackground>
                    <NoInternet />
                    <View style={[Platform.OS == 'ios' ? Common.marginTop0 : Common.marginTop5, Common.marginHorizontal15]}>
                        <View style={[Common.flexRow, Common.justifySBetween]}>
                            <View style={[]}>
                                <Text style={[AppCommon.h4, Input.fontBold, Colors.whiteFnColor]}>Recent Searches</Text>
                            </View>
                            <TouchableHighlight
                                onPress={() => { this.clearClick(); }}
                                underlayColor={global.TRANSPARENT_COLOR}
                                style={[]}>
                                <Text style={[AppCommon.h5, Input.fontBold, Colors.greyFnColor]}>CLEAR</Text>
                            </TouchableHighlight>
                        </View>
                        <View style={[Common.marginTop15]}>
                            {recentlySearchesDataView}
                        </View>
                    </View >
                    <View style={[Common.marginHorizontal15, Common.marginVertical15]}>
                        <Text style={[AppCommon.h4, Input.fontBold, Colors.whiteFnColor]}>Frequencies</Text>
                    </View>
                    <FlatList
                        ref={ref => this.flatList = ref}
                        style={[Common.marginHorizontal15]}
                        data={this.state.frequenciesArray}
                        numColumns={1}
                        renderItem={this.renderItem}
                        ListEmptyComponent={this.state.frequenciesArray.length < 1 && this.state.isLoading == false ? this.ListEmptyView : null}
                        keyExtractor={(item, index) => index.toString()}
                        onEndReachedThreshold={0.5}
                        // ListHeaderComponent={this.renderListHeader}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                        onEndReached={() => { this.handleEnd() }}
                        refreshControl={
                            <RefreshControl
                                tintColor={global.DEFAULT_COLOR}
                                refreshing={this.state.listsRefresh}
                                onRefresh={this.refreshList.bind(this)}
                            />
                        }
                    />
                    <View style={[Common.positionAbs, Common.right15, Common.zIndex9999, {
                        top: alphabetTop,
                        height: alphabetHeight,
                    }]}>
                        {alphabetView}
                    </View>
                    <SmallPlayerView screen='SearchTab' showPlayerView={this.showPlayerView} />
                </View >
            )
        } else {
            var frequenciesValue = this.state.frequenciesValue
            frequenciesValue = frequenciesValue.toFixed(2)
            // var progressImageView = []
            // if (this.state.selectedFrequenciesType == 1) {
            //     progressImageView.push(
            //         <ProgressImage
            //             source={require('../Images/Sine.gif')}
            //             style={[{ width: width, height: (global.IS_IPAD ? 250 : 180) }]}
            //             imageStyle={[{ width: width, height: (global.IS_IPAD ? 250 : 180), resizeMode: "cover" }]}
            //         />
            //     );
            // } else if (this.state.selectedFrequenciesType == 2) {
            //     progressImageView.push(
            //         <ProgressImage
            //             source={require('../Images/Sine.gif')}
            //             style={[{ width: width, height: (global.IS_IPAD ? 250 : 180) }]}
            //             imageStyle={[{ width: width, height: (global.IS_IPAD ? 250 : 180), resizeMode: "cover" }]}
            //         />
            //     );
            // } else if (this.state.selectedFrequenciesType == 3) {
            //     progressImageView.push(
            //         <ProgressImage
            //             source={require('../Images/Sine.gif')}
            //             style={[{ width: width, height: (global.IS_IPAD ? 250 : 180) }]}
            //             imageStyle={[{ width: width, height: (global.IS_IPAD ? 250 : 180), resizeMode: "cover" }]}
            //         />
            //     );
            // } else {
            //     progressImageView.push(
            //         <ProgressImage
            //             source={require('../Images/Sine.gif')}
            //             style={[{ width: width, height: (global.IS_IPAD ? 250 : 180) }]}
            //             imageStyle={[{ width: width, height: (global.IS_IPAD ? 250 : 180), resizeMode: "cover" }]}
            //         />
            //     );
            // }
            return (
                <View style={[AppCommon.mainContainer, Colors.fullLightBlackBgColor]}>
                    <Notification screen='FrequenciesTab' />
                    <Loader visible={this.state.isLoading} />
                    {/* <SafeAreaView style={[Colors.fullLightBlackBgColor]}>
                </SafeAreaView> */}
                    {Platform.OS == 'ios' ?
                        <StatusBar translucent backgroundColor={Colors.fullLightBlackBgColor} barStyle="light-content" />
                        : null}
                    <View style={[global.FULL_DISPLAY ? Common.marginTop50 : Common.marginTop30, Common.marginHorizontal20, Common.flexRow, Common.justifyCenter]}>
                        {/* <TouchableHighlight
                        style={[]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.setState({ selectedFrequenciesType: 1 }); }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 1 ? require('../Images/Sine_Selected.png') : require('../Images/Sine.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft25]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.setState({ selectedFrequenciesType: 2 }); }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 2 ? require('../Images/Square_Selected.png') : require('../Images/Square.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft25]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.setState({ selectedFrequenciesType: 3 }); }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 3 ? require('../Images/Triangle_Selected.png') : require('../Images/Triangle.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft25]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.setState({ selectedFrequenciesType: 4 }); }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 4 ? require('../Images/Saw_Selected.png') : require('../Images/Saw.png')} />
                    </TouchableHighlight> */}
                    </View>
                    <NoInternet />
                    <View style={[Common.marginTop50, Common.flexRow, Common.justifyCenter, Common.alignItmCenter, Common.height40]}>
                        <TouchableHighlight
                            onPress={() => { this.changeShowView('SearchTab') }}
                            underlayColor={global.TRANSPARENT_COLOR}
                            style={[Common.paddingVertical5, Common.marginRight5]}>
                            <View style={[Common.alignItmCenter]}>
                                <Text style={[AppCommon.h4, Input.fontBold, this.state.showView == 'SearchTab' ? Colors.whiteFnColor : Colors.drakGreyFnColor]}>PROGRAMS</Text>
                                {this.state.showView == 'SearchTab' ?
                                    <LinearGradient
                                        start={{ x: 0.0, y: 0.50 }}
                                        end={{ x: 1.3, y: 1.0 }}
                                        style={[Common.marginTop5, { width: "60%", height: (global.IS_IPAD ? 5 : 3) }]}
                                        colors={[global.GRADIENT_BOTTOM_COLOR, global.GRADIENT_RIGHT_COLOR,]}>
                                    </LinearGradient>
                                    :
                                    <View style={[Common.marginTop5, { height: (global.IS_IPAD ? 5 : 3) }]}></View>
                                }
                            </View>
                        </TouchableHighlight>
                        <TouchableHighlight
                            onPress={() => { this.changeShowView('FrequenciesTab') }}
                            underlayColor={global.TRANSPARENT_COLOR}
                            style={[Common.marginLeft30, Common.paddingVertical5, Common.marginRight5]}>
                            <View style={[Common.alignItmCenter]}>
                                <Text style={[AppCommon.h4, Input.fontBold, this.state.showView == 'FrequenciesTab' ? Colors.whiteFnColor : Colors.drakGreyFnColor]}>FREQUENCIES</Text>
                                {this.state.showView == 'FrequenciesTab' ?
                                    <LinearGradient
                                        start={{ x: 0.0, y: 0.50 }}
                                        end={{ x: 1.3, y: 1.0 }}
                                        style={[Common.marginTop5, { width: "60%", height: (global.IS_IPAD ? 5 : 3) }]}
                                        colors={[global.GRADIENT_BOTTOM_COLOR, global.GRADIENT_RIGHT_COLOR,]}>
                                    </LinearGradient>
                                    :
                                    <View style={[Common.marginTop5, { height: (global.IS_IPAD ? 5 : 3) }]}></View>
                                }
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={[Common.marginTop20, Common.justifyCenter, Common.alignItmCenter, { height: (global.IS_IPAD ? 150 : 100) }]}>
                        {/* {this.state.isPlay ?
                        progressImageView
                        : null} */}
                    </View>
                    <ScrollView style={[Common.marginTop20, { width: width }]} alwaysBounceVertical={false} contentInsetAdjustmentBehavior="always" vertical={true} bounces={true}>
                        <View style={[AppCommon.container]}>
                            <View style={[Common.flexRow, Common.justifyCenter, Common.alignItmCenter]}>
                                <TouchableHighlight
                                    style={[Common.paddingHorizontal10, Common.paddingVertical10]}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    onPress={() => { this.frequenciesValuesChange('minus') }}>
                                    <Image style={[AppCommon.icon24]} source={require('../Images/chevron_3.png')} />
                                </TouchableHighlight>
                                <View style={[Common.marginHorizontal10, Common.flexRow, Common.alignItmFEnd]}>
                                    <Text style={[AppCommon.extraBigFont, Input.fontBold, this.state.isPlay ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>{frequenciesValue}</Text>
                                    <Text style={[Common.marginLeft1, AppCommon.h3, Input.fontBold, this.state.isPlay ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>Hz</Text>
                                </View>
                                <TouchableHighlight
                                    style={[Common.paddingHorizontal10, Common.paddingVertical10]}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    onPress={() => { this.frequenciesValuesChange('plus') }}>
                                    <Image style={[AppCommon.icon24]} source={require('../Images/chevron_4.png')} />
                                </TouchableHighlight>
                            </View>
                            <View style={[Common.marginTop20, Common.flexRow, Common.justifySEvenly, Common.alignItmCenter, Common.border2, Common.borderRadius5, Colors.lightGreyBorder]}>
                                <TouchableHighlight
                                    onPress={() => { this.sliderRangeChange('All') }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingVertical7]}>
                                    <Text style={[AppCommon.h5, this.state.selectRange == 'All' ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>All</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    onPress={() => { this.sliderRangeChange('5-500 hz') }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingVertical7]}>
                                    <Text style={[AppCommon.h5, this.state.selectRange == '5-500 hz' ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>5-500 hz</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    onPress={() => { this.sliderRangeChange('500-1k') }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingVertical7]}>
                                    <Text style={[AppCommon.h5, this.state.selectRange == '500-1k' ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>500-1k</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    onPress={() => { this.sliderRangeChange('1k-3k') }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingVertical7]}>
                                    <Text style={[AppCommon.h5, this.state.selectRange == '1k-3k' ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>1k-3k</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    onPress={() => { this.sliderRangeChange('3k-11k') }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingVertical7]}>
                                    <Text style={[AppCommon.h5, this.state.selectRange == '3k-11k' ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>3k-11k</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    onPress={() => { this.sliderRangeChange('11k-28k') }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.paddingVertical7]}>
                                    <Text style={[AppCommon.h5, this.state.selectRange == '11k-28k' ? Colors.defaultFnColor : Colors.lightGreyFnColor]}>11k-28k</Text>
                                </TouchableHighlight>

                            </View>
                            <View style={[Common.marginTop20, Common.justifyCenter, Common.alignItmCenter]}>
                                <MultiSlider
                                    values={[this.state.firstSelectValue]}
                                    min={this.state.firstSliderValueMin}
                                    max={this.state.firstSliderValueMix}
                                    step={1}
                                    sliderLength={width - global.Gap_15 - global.Gap_15 - (global.IS_IPAD ? 30 : 20) - (global.IS_IPAD ? 30 : 20)}
                                    onValuesChange={(values) => this.sliderValuesChange('first', values[0])}
                                    selectedStyle={[Common.height7, Common.borderRadius10, Colors.lightGreyBgColor]}
                                    unselectedStyle={[Common.height7, Common.borderRadius10, Colors.lightGreyBgColor]}
                                    customMarker={() =>
                                        <View style={[AppCommon.icon20, Common.marginTop5, Common.borderRadius20, Colors.lightGreyBgColor]}>
                                        </View>
                                    }
                                />
                            </View>
                            <View style={[Common.justifyCenter, Common.justifyCenter, Common.alignItmCenter, { marginTop: -global.Gap_10 }]}>
                                <Text style={[AppCommon.h4, Colors.lightGreyFnColor]}>Hz</Text>
                            </View>
                            <View style={[Common.marginTop0, Common.justifyCenter, Common.alignItmCenter]}>
                                <MultiSlider
                                    values={[this.state.frequenciesValue]}
                                    min={this.state.secondSliderValueMin}
                                    max={this.state.secondSliderValueMix}
                                    step={0.01}
                                    sliderLength={width - global.Gap_15 - global.Gap_15 - (global.IS_IPAD ? 30 : 20) - (global.IS_IPAD ? 30 : 20)}
                                    onValuesChange={(values) => this.sliderValuesChange('second', values[0])}
                                    selectedStyle={[Common.height7, Common.borderRadius10, Colors.lightGreyBgColor]}
                                    unselectedStyle={[Common.height7, Common.borderRadius10, Colors.lightGreyBgColor]}
                                    customMarker={() =>
                                        <View style={[AppCommon.icon20, Common.marginTop5, Common.borderRadius20, Colors.lightGreyBgColor]}>
                                        </View>
                                    }
                                />
                            </View>
                            <View style={[Common.justifyCenter, Common.justifyCenter, Common.alignItmCenter, { marginTop: -global.Gap_10 }]}>
                                <Text style={[AppCommon.h4, Colors.lightGreyFnColor]}>Fine Tune Hz</Text>
                            </View>
                            <View style={[Common.marginTop40, Common.justifyCenter, Common.alignItmCenter]}>
                                <TouchableHighlight
                                    onPress={() => { this.playClick() }}
                                    underlayColor={global.TRANSPARENT_COLOR}
                                    style={[Common.height45, Common.width150, Common.justifyCenter, Common.alignItmCenter, Common.borderRadius25, Common.border2, Colors.defaultBorder, Colors.transparentBgColor]}>
                                    <Text style={[AppCommon.h4, Colors.defaultFnColor, Input.fontBold]}>{this.state.isPlay ? 'STOP' : 'PLAY'}</Text>
                                </TouchableHighlight>
                            </View>
                        </View >
                    </ScrollView>
                </View >
            );
        }
    }
}