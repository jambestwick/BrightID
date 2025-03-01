import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  TextInputProps,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from '@react-native-community/blur';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import {
  DEVICE_LARGE,
  DEVICE_IOS,
  DEVICE_ANDROID,
  WIDTH,
} from '@/utils/deviceConstants';
import { DARK_ORANGE, DARKER_GREY, WHITE, BLACK, GREEN } from '@/theme/colors';
import { fontSize } from '@/theme/fonts';
import { useDispatch, useSelector } from '@/store';
import socialMediaList from './socialMediaList';
import { saveSocialMedia, selectSocialMediaById } from './socialMediaSlice';

/** Helper functions */

// value is the social media id, label is the name
const toPickerItem = ([value, { name }]) => (
  <Picker.Item key={value} value={value} label={name} />
);

const socialMediaKeyValues = Object.entries(socialMediaList) as [
  SocialMediaId,
  ValueOf<typeof socialMediaList>,
][];

const keyboardTypes: { [id: string]: KeyboardTypeOptions } = {
  username: 'default',
  'telephone #': 'phone-pad',
  email: 'email-address',
  url: DEVICE_IOS ? 'url' : 'default',
};

const textContentTypes: { [id: string]: TextInputProps['textContentType'] } = {
  username: 'username',
  'telephone #': 'telephoneNumber',
  email: 'emailAddress',
  url: 'URL',
};

/** Main Component */
type props = StackScreenProps<ModalStackParamList, 'SelectSocialMedia'>;

const SelectMediaModal = ({ route }: props) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const prevId = route.params?.prevId;
  const initialPage = route.params?.page;

  const existingSocialMediaIds = useSelector(
    (state: State) => state.socialMedia.ids,
  ) as SocialMediaId[];

  // only display social media not already selected by user when adding a new one to the list
  // or allow the user to switch order if editing the social media from the list
  const socialMediaToDisplay = useMemo(
    () =>
      prevId
        ? socialMediaKeyValues
        : socialMediaKeyValues.filter(
            ([id]) => !existingSocialMediaIds.includes(id),
          ),
    [existingSocialMediaIds, prevId],
  );

  const PickerItems = useMemo(
    () => socialMediaToDisplay.map(toPickerItem),
    [socialMediaToDisplay],
  );

  const defaultItem = (socialMediaToDisplay[0] &&
    socialMediaToDisplay[0][0]) as SocialMediaId;

  // if the user is clicking on an existing social media, select that first
  // or display the first item in the picker if the user is adding a new social media
  const firstItem = prevId ?? defaultItem;

  // selectedId tracks state of the picker, will always be an id from socialMediaList.js
  const [selectedId, setSelectedId] = useState<SocialMediaId>(firstItem);

  const prevProfile = useSelector((state: State) =>
    selectSocialMediaById(state, selectedId),
  );

  // social media profile value
  const [profile, setProfile] = useState(prevProfile?.profile ?? '');

  // update profile when modal is re-opened or new profile selected
  useEffect(() => {
    setProfile(prevProfile?.profile ?? '');
  }, [prevProfile]);

  // which page of the modal are we on
  // user can directly start editing profile if they click on their profile
  const [page, setPage] = useState(initialPage ?? 0);

  const { t } = useTranslation();

  // refresh state when the modal opens
  useFocusEffect(
    useCallback(() => {
      setSelectedId(firstItem);
    }, [firstItem]),
  );

  const saveProfile = () => {
    const socialMedia: SocialMedia = {
      id: selectedId,
      company: socialMediaList[selectedId],
      order: route.params?.order ?? 0,
      profile,
    };
    dispatch(saveSocialMedia(socialMedia));
    navigation.navigate('Edit Profile');
  };

  return (
    <View style={styles.container}>
      <BlurView
        style={styles.blurView}
        blurType="dark"
        blurAmount={5}
        reducedTransparencyFallbackColor={BLACK}
      />
      <KeyboardAvoidingView style={styles.modalContainer}>
        {page === 0 ? (
          <Picker
            selectedValue={selectedId}
            style={styles.pickerStyle}
            itemStyle={styles.pickerItemStyle}
            onValueChange={(itemValue: SocialMediaId) => {
              setSelectedId(itemValue);
            }}
          >
            {PickerItems}
          </Picker>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {socialMediaList[selectedId].shareType}
            </Text>
            <TextInput
              style={styles.socialMediaInput}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus={true}
              blurOnSubmit={true}
              keyboardType={
                keyboardTypes[socialMediaList[selectedId].shareType]
              }
              placeholder={`add ${socialMediaList[selectedId].shareType}`}
              placeholderTextColor={DARKER_GREY}
              textContentType={
                textContentTypes[socialMediaList[selectedId].shareType]
              }
              onChangeText={setProfile}
              value={profile}
            />
          </View>
        )}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { opacity: page === 1 && profile.length === 0 ? 0.5 : 1 },
            ]}
            onPress={() => {
              page === 1 ? saveProfile() : setPage(1);
            }}
            disabled={page === 1 && profile.length === 0}
          >
            <Text style={styles.saveButtonText}>
              {page === 1
                ? t('common.button.save')
                : t('profile.button.socialNext')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              navigation.navigate('Eula');
              // if initial page is 1, users only want to edit text
              page === 1 && initialPage !== 1
                ? setPage(0)
                : navigation.navigate('Edit Profile');
            }}
          >
            <Text style={styles.cancelButtonText}>
              {page === 1 && initialPage !== 1
                ? t('profile.button.socialPrevious')
                : t('common.button.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  blurView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    width: WIDTH * 0.75,
    borderRadius: 25,
    paddingHorizontal: DEVICE_LARGE ? 36 : 30,
    paddingBottom: DEVICE_LARGE ? 36 : 30,
    paddingTop: DEVICE_ANDROID ? (DEVICE_LARGE ? 36 : 30) : 0,
  },
  pickerStyle: { width: '100%' },
  pickerItemStyle: {
    fontFamily: 'Poppins-Medium',
    fontSize: fontSize[15],
  },
  saveContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: DEVICE_LARGE ? 18 : 15,
  },
  saveButton: {
    width: DEVICE_LARGE ? 92 : 80,
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginRight: DEVICE_LARGE ? 22 : 18,
  },
  saveButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: fontSize[12],
  },
  cancelButton: {
    width: DEVICE_LARGE ? 92 : 80,
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARKER_GREY,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: fontSize[12],
    color: DARKER_GREY,
  },
  socialMediaInput: {
    flexGrow: 1,
    fontFamily: 'Poppins-Light',
    fontSize: fontSize[14],
    color: BLACK,
  },
  inputContainer: {
    width: '100%',
    paddingTop: DEVICE_IOS ? (DEVICE_LARGE ? 36 : 30) : 0,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: fontSize[11],
    color: DARK_ORANGE,
    marginBottom: DEVICE_LARGE ? 5 : 3,
  },
});

export default SelectMediaModal;
