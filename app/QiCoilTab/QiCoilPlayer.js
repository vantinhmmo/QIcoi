import React, { Component } from 'react';
import { TouchableHighlight, Text, View, SafeAreaView, Image, FlatList, StatusBar, NativeModules, RefreshControl, Dimensions, Alert, Platform, ScrollView, Linking, AppState, TextInput, ImageBackground, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import AsyncStorage from '@react-native-community/async-storage';
import Modal from 'react-native-modal';
import Sound from 'react-native-sound'
import MusicControl, { Command } from 'react-native-music-control'
import * as Progress from 'react-native-progress';
import RNFetchBlob from 'rn-fetch-blob';

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

export default class QiCoilPlayer extends Component {
    constructor(props) {
        super(props);
        functions = new Functions();
        webFunctions = new WebFunctions();
        this.state = {
            isLoading: false,
            FrequenciesTotalTime: 300,
            callType: '',   //  SmallPlayerView  SelectItem
            txtSubTitle: '',
            isPlaying: false,
            dataArray: [],
            playIndex: 0,
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
            this.setState({
                txtSubTitle: global.PLAY_SUB_TITLE,
                isPlaying: global.IS_PLAY,
                dataArray: global.PLAY_DATA,
                albumArray: global.ALBUM_DATA,
            }, () => {
            })
        } else {
            let playIndex = this.props.navigation.getParam('playIndex', 0);
            let albumArray = this.props.navigation.getParam('albumArray', []);
            let playData = this.props.navigation.getParam('playData', []);
            global.PLAY_INDEX = playIndex
            global.ALBUM_DATA = albumArray
            global.PLAY_DATA = playData
            global.PLAY_SUB_TITLE = ''
            global.IS_PLAY = false
            this.setState({
                playIndex: global.PLAY_INDEX,
                txtSubTitle: global.PLAY_SUB_TITLE,
                isPlaying: global.IS_PLAY,
                albumArray: global.ALBUM_DATA,
                dataArray: global.PLAY_DATA,
            }, () => {
                this.playAlbum(playIndex)
            })
        }
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
        }, () => {
            global.PLAY_SOUND.stop()
            global.PLAY_SOUND = null
            clearInterval(global.INTERVAL);
        })
    }

    onPreviousClick() {
        var playIndex = this.state.playIndex - 1
        if (playIndex > -1) {
            if (this.state.isPlaying) {
                global.IS_PLAY = false
                global.PLAY_SUB_TITLE = ''
                global.CURRENT_SECONDS = 0
                this.setState({
                    txtSubTitle: '',
                    isPlaying: false,
                }, () => {
                    global.PLAY_SOUND.stop()
                    global.PLAY_SOUND = null
                    clearInterval(global.INTERVAL);
                    global.PLAY_INDEX = playIndex
                    this.setState({ playIndex: playIndex }, () => {
                        this.playAlbum(playIndex)
                    })
                })
            } else {
                var playIndex = this.state.playIndex - 1
                if (playIndex > -1) {
                    global.PLAY_INDEX = playIndex
                    this.setState({ playIndex: playIndex }, () => {
                        this.playAlbum(playIndex)
                    })
                }
            }
        }
    }

    onPlayClick() {
        if (global.PLAY_SOUND == null) {
            clearInterval(global.INTERVAL);
            this.playAlbum(global.PLAY_INDEX)
        } else {
            if (global.IS_PLAY) {
                this.pauseSong()
            } else {
                this.playSong()
            }
        }
    }

    playSong() {
        if (global.PLAY_SOUND != null) {
            global.IS_PLAY = true
            this.setState({
                isPlaying: true,
            }, () => {
                global.PLAY_SOUND.play();
                global.INTERVAL = setInterval(() => {
                    global.CURRENT_SECONDS = global.CURRENT_SECONDS + 1
                    this.setState({ currentSeconds: CURRENT_SECONDS })
                }, 1000)
            })
        }
    }

    pauseSong() {
        if (global.PLAY_SOUND != null) {
            global.IS_PLAY = false
            global.SMALL_VIEW_IS_PLAY = false
            this.setState({
                isPlaying: false,
            }, () => {
                global.PLAY_SOUND.pause();
                clearInterval(global.INTERVAL);
            })
        }
    }

    onNextClick() {
        var playIndex = this.state.playIndex + 1
        if (this.state.dataArray.length > playIndex) {
            if (this.state.isPlaying) {
                global.IS_PLAY = false
                global.PLAY_SUB_TITLE = ''
                global.CURRENT_SECONDS = 0
                this.setState({
                    txtSubTitle: '',
                    isPlaying: false,
                }, () => {
                    global.PLAY_SOUND.stop()
                    global.PLAY_SOUND = null
                    clearInterval(global.INTERVAL);
                    global.PLAY_INDEX = playIndex
                    this.setState({ playIndex: playIndex }, () => {
                        this.playAlbum(playIndex)
                    })
                })
            } else {
                var playIndex = this.state.playIndex + 1
                if (this.state.dataArray.length > playIndex) {
                    global.PLAY_INDEX = playIndex
                    this.setState({ playIndex: playIndex }, () => {
                        this.playAlbum(playIndex)
                    })
                }
            }
        }
    }

    playAlbum(index = 0) {
        if (global.PLAY_SOUND != null) {
            global.PLAY_SOUND.stop()
            global.PLAY_SOUND = null
            global.CURRENT_SECONDS = 0
            clearInterval(global.INTERVAL);
        }
        this.setState({ isLoading: true })
        var txtSubTitle = ''
        var album_path = ''
        this.state.dataArray.map((data, i) => {
            if (i == index) {
                txtSubTitle = data.name
                album_path = data.audio_file
            }
        })
        var album_image = ''
        if (this.state.albumArray) {
            album_image = this.state.albumArray.image_path
        }
        global.PLAY_SOUND = new Sound(album_path, '', (error) => {
            if (error) {
                this.setState({ isLoading: false })
                // console.log('error ==> ', error);
                Alert.alert('NOTIFICATION', error.message, [{
                    text: 'Ok',
                    onPress: () => { },
                    style: 'cancel'
                }]);
                return;
            } else {
                this.setState({ isLoading: false })
                global.PLAYER_USED = 1
                global.PLAY_SOUND.play();
                global.IS_PLAY = true
                global.PLAY_SUB_TITLE = txtSubTitle
                global.PLAY_ALBUM_IMAGE = album_image
                global.CURRENT_SECONDS = 0
                global.PLAY_INDEX = index
                MusicControl.setNowPlaying({
                    title: global.PLAY_SUB_TITLE,
                    artwork: global.PLAY_ALBUM_IMAGE
                })
                MusicControl.enableBackgroundMode(true);
                MusicControl.enableControl('play', true)
                MusicControl.enableControl('pause', true)
                MusicControl.enableControl('nextTrack', true)
                MusicControl.enableControl('previousTrack', true)
                MusicControl.enableControl('stop', true)

                MusicControl.on(Command.play, () => {
                    this.onPlayClick()
                })
                MusicControl.on(Command.pause, () => {
                    this.onPlayClick()
                })
                MusicControl.on(Command.nextTrack, () => {
                    this.onNextClick()
                })
                MusicControl.on(Command.previousTrack, () => {
                    this.onPreviousClick()
                })
                MusicControl.on(Command.stop, () => {
                    this.onStopClick()
                })

                global.SMALL_VIEW_SHOW = true
                global.SMALL_VIEW_IS_PLAY = true
                global.SMALL_VIEW_TEXT = txtSubTitle

                if (global.FREQUENCIES_TAB_IS_PLAY) {
                    global.FREQUENCIES_TAB_IS_PLAY = false
                }

                this.setState({
                    isPlaying: global.IS_PLAY,
                    txtSubTitle: global.PLAY_SUB_TITLE,
                }, () => {
                    clearInterval(global.INTERVAL);
                    global.INTERVAL = setInterval(() => {
                        global.CURRENT_SECONDS = global.CURRENT_SECONDS + 1
                        this.setState({ currentSeconds: CURRENT_SECONDS })
                    }, 1000)
                })

                AsyncStorage.getItem('recentlyPlayedAlbumsArray', (err, recentlyPlayedAlbumsArray) => {
                    var oldPlayedAlbumsArray = JSON.parse(recentlyPlayedAlbumsArray)
                    if (oldPlayedAlbumsArray != null && oldPlayedAlbumsArray != undefined) {
                        oldPlayedAlbumsArray = oldPlayedAlbumsArray.reverse()
                        var item = []
                        var checkFlag = 0
                        var dataArray = []
                        for (var i = 0; i < oldPlayedAlbumsArray.length; ++i) {
                            if (i < 4) {
                                item = oldPlayedAlbumsArray[i];
                                if (item.id == this.state.albumArray.id) {
                                    checkFlag = 1
                                } else if (i > oldPlayedAlbumsArray.length - 4) {
                                    dataArray = [item, ...dataArray];
                                }
                            }
                        }
                        if (checkFlag == 0) {
                            dataArray = [this.state.albumArray, ...dataArray];
                            AsyncStorage.setItem('recentlyPlayedAlbumsArray', JSON.stringify(dataArray));
                        }
                    } else {
                        var dataArray = []
                        dataArray.push(this.state.albumArray)
                        AsyncStorage.setItem('recentlyPlayedAlbumsArray', JSON.stringify(dataArray));
                    }
                });
            }
        });
    }

    getTime(seconds = 0) {
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
        var categoryName = ''
        var subCategoryName = ''
        var image_path = ''
        if (this.state.albumArray) {
            categoryName = this.state.albumArray.categoryName
            subCategoryName = this.state.albumArray.subCategoryName
            image_path = this.state.albumArray.image_path
        }
        return (
            <View style={[AppCommon.mainContainer, Colors.fullLightBlackBgColor]}>
                <Notification screen='QiCoilPlayer' />
                <LoaderSecond visible={this.state.isLoading} />
                {/* <SafeAreaView style={[Colors.fullLightBlackBgColor]}>
                </SafeAreaView> */}
                {Platform.OS == 'ios' ?
                    <StatusBar translucent backgroundColor={Colors.fullLightBlackBgColor} barStyle="light-content" />
                    : null}
                <View style={[global.FULL_DISPLAY ? Common.marginTop60 : Common.marginTop40, Common.marginHorizontal20]}>
                    <TouchableHighlight
                        onPress={() => { this.backButtonClick() }}
                        underlayColor={global.TRANSPARENT_COLOR}
                        style={[Common.zIndex9, Common.marginTop10, Common.flex01, Common.flexRow, Common.justifyFStart, Common.alignItmFStart]}>
                        <View style={[Common.flexRow, Common.justifyFStart, Common.alignItmCenter]}>
                            <Image style={[AppCommon.icon22]} source={require('../Images/chevron_2.png')} />
                        </View>
                    </TouchableHighlight>
                    <View style={[AppCommon.topBarTitle, Common.flexColumn]}>
                        <Text style={[AppCommon.h5, Colors.lightGreyFnColor, Input.fontBold]}>{categoryName}</Text>
                        <Text style={[Common.marginTop2, AppCommon.h3, Colors.whiteFnColor, Input.fontBold]}>{subCategoryName}</Text>
                    </View>
                </View>
                <NoInternet />
                <View style={[Common.marginTop80, Common.justifyCenter, Common.alignItmCenter]}>
                    <ProgressImage
                        source={image_path ? { uri: image_path } : require('../Images/album_default.png')}
                        style={[AppCommon.qiCoilPlayerImage, Colors.lightGreyBgColor]}
                        imageStyle={[AppCommon.qiCoilPlayerImage, Colors.lightGreyBgColor]}>
                    </ProgressImage>
                </View>
                <View style={[Common.marginTop20, Common.height100, Common.marginHorizontal10, Common.alignItmCenter]}>
                    <Text style={[AppCommon.h3, Input.fontBold, Colors.whiteFnColor]}>{this.state.txtSubTitle}</Text>
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
                </View>
                <View style={[Common.marginTop20]}></View>
            </View>
        );
    }
}

