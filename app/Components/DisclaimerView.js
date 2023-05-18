import React, { Component } from 'react';
import { TouchableHighlight, Text, View, SafeAreaView, Image, FlatList, StatusBar, NativeModules, RefreshControl, Dimensions, Alert, Platform, ScrollView, Linking, AppState, TextInput, ImageBackground, BackHandler, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import AsyncStorage from '@react-native-community/async-storage';

import Notification from '../Components/Notification';
import Loader from '../Components/Loader';
import NoInternet from '../Components/NoInternet';
import LoaderSecond from '../Components/LoaderSecond';

import AppCommon from '../CSS/AppCommon';
import Colors from '../CSS/Colors';
import Common from '../CSS/Common';
import Input from '../CSS/Input';

import WebFunctions from '../Networking/WebFunctions';
import Functions from '../Includes/Functions';

import AppIntroSlider from '../Lib/Slider/Slider';
import ProgressImage from '../Lib/ProgressImage/ProgressImage';

const { width, height } = Dimensions.get("window")

export default class DisclaimerView extends Component {
	constructor(props) {
		super(props);
		functions = new Functions();
		webFunctions = new WebFunctions();
		this.state = {
		}
	}

	componentDidMount() {
	}

	componentWillReceiveProps() {
	}

	closeDisclaimerView() {
		this.props.closeDisclaimerView()
	}

	render() {
		return (
			<View style={[AppCommon.aboutView]}>
				<TouchableHighlight
					onPress={() => { this.closeDisclaimerView() }}
					underlayColor={global.TRANSPARENT_COLOR}
					style={[Common.zIndex99, Common.positionAbs, Common.top5, Common.right5, AppCommon.icon35, Common.justifyCenter, Common.alignItmCenter]}>
					<Image style={[AppCommon.icon30, Colors.drakGreyTnColor]} source={require('../Images/close.png')} />
				</TouchableHighlight>
				<View style={[Common.marginTop20, Common.paddingHorizontal20]} >
					<Text style={[AppCommon.h3, Input.fontBold, Colors.blackFnColor]}>Disclaimer</Text>
				</View >
				<View style={[Common.marginTop25, Common.paddingHorizontal20]} >
					<Text style={[AppCommon.h3, Colors.blackFnColor]}>None of the products are intended as a diagnosis, treatment, cure, prevention of any disease and have not been evaluated by the FDA. You should never change or stop taking any medication unless you have discussed the situation with your medical practitioner.</Text>
				</View >
				<View style={[Common.marginTop20]} >
				</View >
			</View >
		);
	}
}

