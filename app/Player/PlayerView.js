import React, { Component } from 'react';
import { TouchableHighlight, Text, View, SafeAreaView, Image, FlatList, StatusBar, NativeModules, RefreshControl, Dimensions, Alert, Platform, ScrollView, Linking, AppState, TextInput, ImageBackground, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import AsyncStorage from '@react-native-community/async-storage';
import Modal from 'react-native-modal';
import Frequency from 'react-native-frequency';
import MusicControl, { Command } from 'react-native-music-control'
import * as Progress from 'react-native-progress';
import RNFetchBlob from 'rn-fetch-blob';
import moment from 'moment';

import Notification from '../Components/Notification';
import Loader from '../Components/Loader';
import NoInternet from '../Components/NoInternet';
import LoaderSecond from '../Components/LoaderSecond';
import ProgressImage from '../Lib/ProgressImage/ProgressImage';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

const { width, height } = Dimensions.get("window")

export default class PlayerView extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            selectedFrequenciesType: 1,
            FrequenciesTotalTime: 300,
            callType: '',   //  SmallPlayerView  SelectItem
            txtId: '',
            txtTitle: '',
            txtFrequencies: '',
            txtSubTitle: '',
            isPlaying: false,
            dataArray: [],
            playDataArray: [],
            playIndex: 0,
            isFavorite: 0,
        }
        this.timer = null
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        let callType = this.props.navigation.getParam('callType', '');
        this.setState({
            callType: callType,
        }, () => {
            this.setData();
        });
        this.timer = setInterval(() => {
            this.setState({ foo: true })
        }, 1000)
    }

    componentWillReceiveProps(nextProps) {
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        clearInterval(this.timer);
    }

    handleBackButton = () => {
        this.backButtonClick()
        return true;
    }

    handleOnNavigateBack = (foo) => {
        this.setData();
    }

    backButtonClick() {
        this.props.navigation.state.params.onNavigateBack(true)
        this.props.navigation.goBack()
    }

    setData() {
        if (this.state.callType == "SmallPlayerView") {
            var playDataArray = []
            global.PLAY_DATA.map((data, index) => {
                if (global.PLAY_SUB_TITLE == data) {
                    playDataArray = data
                }
            })
            this.setState({
                txtId: global.PLAY_ID,
                txtTitle: global.PLAY_TITLE,
                txtFrequencies: global.PLAY_FREQUENCIES,
                txtSubTitle: global.PLAY_SUB_TITLE,
                isPlaying: global.IS_PLAY,
                dataArray: global.PLAY_DATA,
                playDataArray: playDataArray,
            }, () => {
                this.checkIsFavorite()
            })
        } else {
            let id = this.props.navigation.getParam('id', '');
            let title = this.props.navigation.getParam('title', '');
            let strFrequencies = this.props.navigation.getParam('strFrequencies', '');
            let playData = this.props.navigation.getParam('playData', []);
            global.PLAY_ID = id
            global.PLAY_TITLE = title
            global.PLAY_FREQUENCIES = strFrequencies
            global.PLAY_DATA = playData
            global.PLAY_SUB_TITLE = ''
            global.IS_PLAY = false
            this.setState({
                txtId: global.PLAY_ID,
                txtTitle: global.PLAY_TITLE,
                txtFrequencies: global.PLAY_FREQUENCIES,
                txtSubTitle: global.PLAY_SUB_TITLE,
                isPlaying: global.IS_PLAY,
                dataArray: global.PLAY_DATA,
                playDataArray: [],
            }, () => {
                // this.onPlayClick()
                this.checkIsFavorite()
            })
        }
    }

    checkIsFavorite() {
        var isFavorite = 0
        for (var i = 0; i < global.FAVORITES_DATA.length; ++i) {
            item = global.FAVORITES_DATA[i];
            if (item.id == this.state.txtId && item.title == this.state.txtTitle) {
                isFavorite = 1
                break;
            }
        }
        this.setState({ isFavorite: isFavorite })
    }

    onStopClick() {
        global.IS_PLAY = false
        global.PLAY_SUB_TITLE = ''
        global.CURRENT_SECONDS = 0
        global.SMALL_VIEW_SHOW = false
        global.SMALL_VIEW_IS_PLAY = false
        global.SMALL_VIEW_TEXT = ''
        this.setState({
            txtSubTitle: '',
            isPlaying: false,
            playDataArray: [],
        }, () => {
            Frequency.stop()
            clearInterval(global.INTERVAL);
        })
    }

    onPreviousClick() {
        if (this.state.isPlaying) {
            global.IS_PLAY = false
            global.PLAY_SUB_TITLE = ''
            global.CURRENT_SECONDS = 0
            this.setState({
                txtSubTitle: '',
                isPlaying: false,
            }, () => {
                Frequency.stop()
                clearInterval(global.INTERVAL);
                var playIndex = this.state.playIndex - 1
                if (playIndex > -1) {
                    global.PLAY_INDEX = playIndex
                    this.setState({ playIndex: playIndex }, () => {
                        this.playFrequency(this.state.dataArray[playIndex])
                    })
                }
            })
        } else {
            var playIndex = this.state.playIndex - 1
            if (playIndex > -1) {
                global.PLAY_INDEX = playIndex
                this.setState({ playIndex: playIndex }, () => {
                    this.playFrequency(this.state.dataArray[playIndex])
                })
            }
        }

    }

    onPlayClick() {
        if (this.state.isPlaying) {
            global.IS_PLAY = false
            global.PLAY_SUB_TITLE = ''
            // global.CURRENT_SECONDS = 0
            global.SMALL_VIEW_IS_PLAY = false
            this.setState({
                txtSubTitle: '',
                isPlaying: false,
            }, () => {
                Frequency.stop()
                clearInterval(global.INTERVAL);
            })
        } else {
            if (this.state.dataArray.length > 0) {
                this.playFrequency(this.state.dataArray[this.state.playIndex])
            }
        }
    }

    onNextClick() {
        if (this.state.isPlaying) {
            global.IS_PLAY = false
            global.PLAY_SUB_TITLE = ''
            global.CURRENT_SECONDS = 0
            this.setState({
                txtSubTitle: '',
                isPlaying: false,
            }, () => {
                Frequency.stop()
                clearInterval(global.INTERVAL);
                var playIndex = this.state.playIndex + 1
                if (this.state.dataArray.length > playIndex) {
                    global.PLAY_INDEX = playIndex
                    this.setState({ playIndex: playIndex }, () => {
                        this.playFrequency(this.state.dataArray[playIndex])
                    })
                }
            })
        } else {
            var playIndex = this.state.playIndex + 1
            if (this.state.dataArray.length > playIndex) {
                global.PLAY_INDEX = playIndex
                this.setState({ playIndex: playIndex }, () => {
                    this.playFrequency(this.state.dataArray[playIndex])
                })
            }
        }
    }

    itemClick(dataArray, index) {
        global.CURRENT_SECONDS = 0
        if (dataArray == this.state.txtSubTitle) {
            this.onStopClick()
        } else {
            global.PLAY_INDEX = index
            this.setState({ playIndex: index }, () => {
                this.playFrequency(dataArray)
            })
        }
    }

    playFrequency(dataArray) {
        var frequencyName = dataArray
        global.IS_PLAY = true
        global.PLAY_SUB_TITLE = frequencyName
        this.setState({
            txtSubTitle: global.PLAY_SUB_TITLE,
            isPlaying: global.IS_PLAY,
            playDataArray: dataArray,
        }, () => {
            frequencyName = frequencyName.replace(' Hz', '')
            clearInterval(global.INTERVAL);
            global.INTERVAL = setInterval(() => {
                global.CURRENT_SECONDS = global.CURRENT_SECONDS + 1
                this.setState({ currentSeconds: CURRENT_SECONDS })
                global.TOTAL_PLAY_TIME = global.TOTAL_PLAY_TIME + 1
                AsyncStorage.setItem('total_play_time', JSON.stringify(global.TOTAL_PLAY_TIME));
                if (global.TOTAL_PLAY_TIME > 1800) {
                    var currentDate = moment();
                    this.onStopClick()
                    AsyncStorage.setItem('temp_date_time', JSON.stringify(currentDate));
                    this.props.navigation.navigate('SecondSubscribeView', { transition: 'bottomUp' });
                }
                if (global.CURRENT_SECONDS > this.state.FrequenciesTotalTime - 10) {
                    this.onNextClick()
                }
            }, 1000)
            Frequency.playFrequency(parseFloat(frequencyName), this.state.FrequenciesTotalTime)
                .then(response => {
                    // console.log("response ==>", response)
                    global.CURRENT_SECONDS = 0
                    this.setState({ foo: true })
                }).catch(error => {
                    // console.log("error ==>", error)
                });
            global.PLAYER_USED = 0
            if (global.PLAY_SOUND != null) {
                global.PLAY_SOUND.stop()
                global.PLAY_SOUND = null
            }
            MusicControl.setNowPlaying({
                title: global.PLAY_SUB_TITLE,
                artwork: '../Images/Logo.png'
            })
            MusicControl.enableBackgroundMode(true);
            MusicControl.enableControl('play', true)
            MusicControl.enableControl('pause', true)
            MusicControl.enableControl('stop', true)
            MusicControl.on(Command.play, () => {
                this.onPlayClick()
            })
            MusicControl.on(Command.pause, () => {
                this.onPlayClick()
            })
            MusicControl.on(Command.stop, () => {
                this.onStopClick()
            })

            global.SMALL_VIEW_SHOW = true
            global.SMALL_VIEW_IS_PLAY = true
            global.SMALL_VIEW_TEXT = this.state.txtTitle + ' - ' + frequencyName + ' Hz'

            if (global.FREQUENCIES_TAB_IS_PLAY) {
                global.FREQUENCIES_TAB_IS_PLAY = false
            }

            AsyncStorage.getItem('recentlyPlayedDataArray', (err, recentlyPlayedDataArray) => {
                var oldPlayedDataArray = JSON.parse(recentlyPlayedDataArray)
                if (oldPlayedDataArray != null && oldPlayedDataArray != undefined) {
                    oldPlayedDataArray = oldPlayedDataArray.reverse()
                    var item = []
                    var checkFlag = 0
                    var dataArray = []
                    for (var i = 0; i < oldPlayedDataArray.length; ++i) {
                        if (i < 3) {
                            item = oldPlayedDataArray[i];
                            if (item.id == this.state.txtId && item.title == this.state.txtTitle) {
                                checkFlag = 1
                            } else if (i > oldPlayedDataArray.length - 3) {
                                dataArray = [{ 'id': item.id, 'title': item.title, 'frequencies': item.frequencies }, ...dataArray];
                            }
                        }
                    }
                    if (checkFlag == 0) {
                        dataArray = [{ 'id': this.state.txtId, 'title': this.state.txtTitle, 'frequencies': this.state.txtFrequencies }, ...dataArray];
                        AsyncStorage.setItem('recentlyPlayedDataArray', JSON.stringify(dataArray));
                    }
                } else {
                    var dataArray = []
                    dataArray.push({ 'id': this.state.txtId, 'title': this.state.txtTitle, 'frequencies': this.state.txtFrequencies })
                    AsyncStorage.setItem('recentlyPlayedDataArray', JSON.stringify(dataArray));
                }
            });
        })
    }

    renderItem = ({ item, index }) => {
        const { navigate } = this.props.navigation;
        return (
            <TouchableHighlight
                onPress={() => { this.itemClick(item, index) }}
                underlayColor={global.TRANSPARENT_COLOR}
                style={[]}>
                <View style={[index == 0 ? Common.marginTop7 : Common.marginTop0, Common.paddingHorizontal15, Common.paddingVertical7, Common.justifyCenter]}>
                    <Text style={[AppCommon.h4, item == this.state.txtSubTitle ? Colors.defaultFnColor : Colors.whiteFnColor]}>{item} Hz</Text>
                </View>
            </TouchableHighlight>
        )
    }

    getTime(seconds = 0, call_type = '') {
        var time = ''
        var divisor_for_minutes = seconds % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);
        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);
        if (minutes > 9) {
            time = time + minutes + ':'
        } else {
            time = time + '0' + minutes + ':'
        }
        if (seconds > 9) {
            time = time + seconds
        } else {
            time = time + '0' + seconds
        }
        return time
    }

    favoriteClick() {
        if (global.USER_DATA.id && global.USER_DATA.id != undefined) {
            var isFavorite = this.state.isFavorite == 1 ? 0 : 1
            this.setState({ isFavorite: isFavorite }, () => {
                var authorization = ""
                if (global.USER_DATA.token && global.USER_DATA.token != undefined) {
                    authorization += "Bearer " + global.USER_DATA.token
                }
                var data_Array = [];
                data_Array.push({ name: 'is_favorite', data: isFavorite.toString() });
                data_Array.push({ name: 'frequency_id', data: this.state.txtId.toString() });
                RNFetchBlob.fetch('POST', global.SAVE_FAVORITE_PROGRAM, {
                    'Content-Type': 'multipart/form-data', 'Authorization': authorization,
                }, data_Array).then((response) => {
                    response = response.json();
                    let resultArray = response['favorite'];
                    if (resultArray.length > 0) {
                        var dataArray = resultArray[0];
                        if (dataArray.fetch_flag != "1") {
                            isFavorite = this.state.isFavorite == 1 ? 0 : 1
                            this.setState({ isFavorite: isFavorite })
                        }
                    } else {
                        isFavorite = this.state.isFavorite == 1 ? 0 : 1
                        this.setState({ isFavorite: isFavorite })
                    }
                }).catch((error) => {
                    isFavorite = this.state.isFavorite == 1 ? 0 : 1
                    this.setState({ isFavorite: isFavorite })
                });
            })
        } else {
            this.props.navigation.navigate('LandingView', { transition: 'bottomUp' });
        }
    }

    render() {
        const { navigate } = this.props.navigation;
        var play_progress = 0
        if (global.CURRENT_SECONDS) {
            play_progress = global.CURRENT_SECONDS / this.state.FrequenciesTotalTime
        }
        var current_time = global.CURRENT_SECONDS
        current_time = this.getTime(current_time)
        var total_time = this.state.FrequenciesTotalTime
        total_time = total_time - global.CURRENT_SECONDS
        total_time = this.getTime(total_time)
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
                <Notification screen='PlayerView' />
                <LoaderSecond visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.fullLightBlackBgColor]}>
                </SafeAreaView> */}
                {Platform.OS == 'ios' ?
                    <StatusBar translucent backgroundColor={Colors.fullLightBlackBgColor} barStyle="light-content" />
                    : null}
                <TouchableHighlight
                    style={[global.FULL_DISPLAY ? Common.marginTop50 : Common.marginTop30, Common.marginLeft20, Common.width30, Common.height30, Common.justifyCenter, Common.alignItmCenter]}
                    underlayColor={global.TRANSPARENT_COLOR}
                    onPress={() => { this.backButtonClick() }}>
                    <Image style={[AppCommon.icon22]} source={require('../Images/chevron_2.png')} />
                </TouchableHighlight>
                <View style={[Common.marginTop10, Common.marginHorizontal20, Common.flexRow, Common.justifyCenter]}>
                    {/* <TouchableHighlight
                        style={[]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => {
                            global.SMALL_VIEW_FREQUENCIES_TYPE = 1
                            this.setState({ selectedFrequenciesType: 1 });
                        }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 1 ? require('../Images/Sine_Selected.png') : require('../Images/Sine.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft25]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => {
                            global.SMALL_VIEW_FREQUENCIES_TYPE = 2
                            this.setState({ selectedFrequenciesType: 2 });
                        }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 2 ? require('../Images/Square_Selected.png') : require('../Images/Square.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft25]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => {
                            global.SMALL_VIEW_FREQUENCIES_TYPE = 3
                            this.setState({ selectedFrequenciesType: 3 });
                        }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 3 ? require('../Images/Triangle_Selected.png') : require('../Images/Triangle.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft25]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => {
                            global.SMALL_VIEW_FREQUENCIES_TYPE = 4
                            this.setState({ selectedFrequenciesType: 4 });
                        }}>
                        <Image style={[AppCommon.icon60]} source={this.state.selectedFrequenciesType == 4 ? require('../Images/Saw_Selected.png') : require('../Images/Saw.png')} />
                    </TouchableHighlight> */}
                </View>
                <NoInternet />
                <View style={[Common.marginTop15, Common.justifyCenter, Common.alignItmCenter, { height: (global.IS_IPAD ? 250 : 180) }]}>
                    {/* {this.state.isPlaying ?
                        progressImageView
                        : null} */}
                </View>
                <View style={[Common.marginTop15, Common.marginHorizontal10, Common.height40, Common.flexRow, Common.justifyCenter, Common.alignItmFEnd]}>
                    <Text style={[AppCommon.bigFont, Input.fontBold, Colors.defaultFnColor]}>{this.state.txtSubTitle ? this.state.txtSubTitle : ''}</Text>
                    <Text style={[AppCommon.h4, Input.fontBold, Colors.defaultFnColor]}>{this.state.txtSubTitle ? 'Hz' : ''}</Text>
                </View>
                <View style={[Common.marginTop20, Common.marginHorizontal20]}>
                    <Progress.Bar
                        progress={play_progress}
                        width={width - (global.IS_IPAD ? 30 : 20) - (global.IS_IPAD ? 30 : 20)}
                        height={global.Gap_5}
                        borderRadius={global.Gap_5}
                        borderWidth={0}
                        color={global.DEFAULT_COLOR}
                        unfilledColor={global.LIGHT_GREY_COLOR} />
                </View>
                <View style={[Common.marginTop5, Common.marginHorizontal20, Common.flexRow, Common.justifySBetween]}>
                    <View style={[]}>
                        <Text style={[AppCommon.h5, Colors.lightGreyFnColor]}>{current_time}</Text>
                    </View>
                    <View style={[]}>
                        <Text style={[AppCommon.h5, Colors.lightGreyFnColor]}>{total_time}</Text>
                    </View>
                </View>
                <View style={[Common.marginTop20, Common.marginHorizontal20, Common.flexRow, Common.justifyCenter]}>
                    <TouchableHighlight
                        style={[]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.onPreviousClick() }}>
                        <Image style={[AppCommon.icon30]} source={require('../Images/previous.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft40]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.onPlayClick() }}>
                        <Image style={[AppCommon.icon30]} source={this.state.isPlaying ? require('../Images/pause.png') : require('../Images/play.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.marginLeft40]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.onNextClick() }}>
                        <Image style={[AppCommon.icon30]} source={require('../Images/next.png')} />
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[Common.positionAbs, AppCommon.icon30, Common.justifyCenter, Common.alignItmCenter, Common.right0]}
                        underlayColor={global.TRANSPARENT_COLOR}
                        onPress={() => { this.favoriteClick() }}>
                        <Image style={[AppCommon.icon20, Common.marginTop2]} source={this.state.isFavorite == 1 ? require('../Images/heart.png') : require('../Images/heart_2.png')} />
                    </TouchableHighlight>
                </View>
                <View style={[Common.marginTop20, Common.justifyCenter, Common.alignItmCenter]}>
                    <Text style={[AppCommon.h4, Colors.whiteFnColor, Input.fontBold]}>{this.state.txtTitle}</Text>
                </View>
                <FlatList
                    style={[Common.marginTop15, Common.marginHorizontal20, Common.borderRadius10, Colors.drakGreyBgColor]}
                    ref={ref => this.flatList = ref}
                    data={this.state.dataArray}
                    numColumns={1}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    onEndReachedThreshold={0.5}
                />
                <View style={[Common.marginTop20]}></View>
            </View>
        );
    }
}

