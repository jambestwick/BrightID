// @flow

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import verificationSticker from '@/static/verification-sticker.svg';
import { DEVICE_LARGE } from '@/utils/deviceConstants';
import { pendingConnection_states } from './pendingConnectionSlice';
import { RatingView } from './RatingView';
import { ConnectionStats } from './ConnectionStats';

// percentage determines reported warning
const REPORTED_PERCENTAGE = 0.1;

type PreviewConnectionProps = {
  pendingConnection: PendingConnection,
  setLevelHandler: (level: ConnectionLevel) => any,
  photoTouchHandler: () => any,
};

export const PreviewConnectionView = (props: PreviewConnectionProps) => {
  const { t } = useTranslation();
  const { pendingConnection, setLevelHandler, photoTouchHandler } = props;

  // Potential workaround for crashes reported in AppCenter with message
  // "TypeError: undefined is not an object (evaluating 'L.reports.length')"
  let reported = false;
  if (pendingConnection && pendingConnection.reports) {
    reported =
      pendingConnection.reports.length /
        (pendingConnection.connectionsNum || 1) >=
      REPORTED_PERCENTAGE;
  } else {
    console.log(`Failed to get reports.length!`);
  }

  const brightIdVerified = pendingConnection.verifications
    .map((v) => v.name)
    .includes('BrightID');
  let ratingView;
  switch (pendingConnection.state) {
    case pendingConnection_states.UNCONFIRMED: {
      ratingView = <RatingView setLevelHandler={setLevelHandler} />;
      break;
    }
    case pendingConnection_states.CONFIRMING:
    case pendingConnection_states.CONFIRMED: {
      // user already handled this connection request
      ratingView = (
        <Text style={styles.infoText}>
          {t('pendingConnection.text.alreadyRated')}
        </Text>
      );
      break;
    }
    case pendingConnection_states.ERROR: {
      ratingView = (
        <Text style={styles.infoText}>
          {t('pendingConnections.text.errorGeneric')}
        </Text>
      );
      break;
    }
    case pendingConnection_states.EXPIRED: {
      ratingView = (
        <Text style={styles.infoText}>
          {t('pendingConnection.text.errorExpired')}
        </Text>
      );
      break;
    }
    case pendingConnection_states.MYSELF: {
      ratingView = (
        <Text style={styles.infoText}>
          {t('pendingConnection.text.errorMyself')}
        </Text>
      );
      break;
    }
    default:
      ratingView = (
        <Text style={styles.infoText}>
          {t('pendingConnection.text.errorUnhandled')}
        </Text>
      );
  }

  return (
    <>
      <View testID="previewConnectionScreen" style={styles.titleContainer}>
        <Text style={styles.titleText}>
          {t('pendingConnections.title.connectionRequest')}{' '}
        </Text>
      </View>
      <View style={styles.userContainer}>
        <TouchableWithoutFeedback onPress={photoTouchHandler}>
          <Image
            source={{ uri: pendingConnection.photo }}
            style={styles.photo}
            resizeMode="cover"
            onError={(e) => {
              console.log(e);
            }}
            accessible={true}
            accessibilityLabel={t('common.accessibilityLabel.userPhoto')}
          />
        </TouchableWithoutFeedback>
        <View style={styles.connectNameContainer}>
          <Text style={styles.connectName}>{pendingConnection.name}</Text>
          {reported && (
            <Text style={styles.reported}> {t('common.tag.reported')}</Text>
          )}
          {brightIdVerified && (
            <View style={styles.verificationSticker}>
              <SvgXml width="16" height="16" xml={verificationSticker} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.countsContainer}>
        <ConnectionStats
          connectionsNum={pendingConnection.connectionsNum}
          groupsNum={pendingConnection.groupsNum}
          mutualConnectionsNum={pendingConnection.mutualConnections.length}
        />
      </View>
      <View style={styles.ratingView}>{ratingView}</View>
    </>
  );
};

const styles = StyleSheet.create({
  waitingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: DEVICE_LARGE ? 16 : 14,
    color: '#333',
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: DEVICE_LARGE ? 18 : 15,
    textAlign: 'left',
    color: '#ffffff',
  },
  titleContainer: {
    marginTop: DEVICE_LARGE ? 18 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'Poppins-Bold',
    fontSize: DEVICE_LARGE ? 22 : 18,
    textAlign: 'center',
    color: '#000000',
  },
  userContainer: {
    marginTop: DEVICE_LARGE ? 12 : 10,
    paddingBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: DEVICE_LARGE ? 120 : 100,
    height: DEVICE_LARGE ? 120 : 100,
    borderRadius: 100,
  },
  connectNameContainer: {
    marginTop: DEVICE_LARGE ? 12 : 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  connectName: {
    fontFamily: 'Poppins-Bold',
    fontSize: DEVICE_LARGE ? 18 : 16,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#000000',
  },
  reported: {
    fontSize: DEVICE_LARGE ? 18 : 16,
    color: 'red',
  },
  countsContainer: {
    width: '88%',
    paddingTop: 6,
    paddingBottom: 6,
    marginTop: 4,
    marginBottom: DEVICE_LARGE ? 12 : 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ed7a5d',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
  },
  connectedText: {
    fontFamily: 'ApexNew-Book',
    fontSize: 14,
    color: '#aba9a9',
    fontStyle: 'italic',
  },
  verificationSticker: {
    marginLeft: DEVICE_LARGE ? 8 : 5,
  },
  ratingView: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '90%',
  },
  infoText: {
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    fontSize: DEVICE_LARGE ? 17 : 15,
    marginTop: 32,
  },
});
