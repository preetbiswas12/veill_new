import { Feather } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import AppMenu from '@/components/AppMenu';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import VideoAttachment from '@/components/VideoAttachment';
import { OutgoingMedia, useCometChat } from '@/hooks/useCometChat';

const formatWhen = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const StoriesScreen = () => {
  const { user, stories, storiesLoading, refreshStories, sendStory } = useCometChat();
  const [viewer, setViewer] = useState<{ senderId: string; index: number } | null>(null);

  useEffect(() => {
    void refreshStories();
  }, [refreshStories]);

  const myStories = stories.find((story) => story.mine);
  const otherStories = stories.filter((story) => !story.mine);

  const viewerAuthor = viewer ? stories.find((story) => story.senderId === viewer.senderId) : null;
  const viewerItem =
    viewer && viewerAuthor && viewer.index < viewerAuthor.items.length
      ? viewerAuthor.items[viewer.index]
      : null;
  const viewerItemCount = viewerAuthor?.items.length || 0;

  const showPrevious = () => {
    if (!viewer) return;
    if (viewer.index > 0) setViewer({ ...viewer, index: viewer.index - 1 });
  };

  const showNext = () => {
    if (!viewer) return;
    if (viewer.index + 1 < viewerItemCount) {
      setViewer({ ...viewer, index: viewer.index + 1 });
    } else {
      setViewer(null);
    }
  };

  const addStory = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Allow photo library access to share a story.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const media: OutgoingMedia = {
        uri: asset.uri,
        name: asset.fileName || asset.uri.split('/').pop() || 'story',
        kind: asset.type === 'video' ? 'video' : 'image',
        mimeType: asset.mimeType ?? undefined,
        size: asset.fileSize ?? undefined,
      };
      await sendStory(media);
    } catch (caught) {
      Alert.alert(
        'Could not share',
        caught instanceof Error ? caught.message : 'The story could not be shared.'
      );
    }
  };

  const storyRing = (hasItems: boolean, size = 56) => (
    <View
      className={clsx(
        'rounded-full p-[3px]',
        hasItems ? 'bg-blue-500' : 'bg-gray-200'
      )}
      style={{ width: size + 6, height: size + 6 }}
    >
      <View className="flex-1 rounded-full bg-white p-[2px]">
        <Avatar
          imageUrl={user?.image}
          name={user?.name || 'You'}
          size={size}
          fontSize={Math.round(size / 2.6)}
          placeholderType="text"
        />
      </View>
    </View>
  );

  return (
    <Screen className="bg-white" viewClassName="px-4 pt-1">
      <View className="flex flex-row items-center justify-between w-full h-8">
        <AppMenu />
        <View className="flex flex-row items-center gap-8">
          <Button variant="plain" onPress={() => void addStory()} accessibilityLabel="Add story">
            <Feather name="camera" size={20} color="black" />
          </Button>
        </View>
      </View>

      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* My story */}
        <Pressable
          onPress={() => void addStory()}
          className="flex-row items-center gap-3 mt-4 w-full"
        >
          <View className="relative">
            {storyRing(Boolean(myStories?.items.length))}
            {!myStories?.items.length ? (
              <View className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border-[3px] border-white bg-blue-600 items-center justify-center">
                <Feather name="plus" size={13} color="white" />
              </View>
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-semibold">My Stories</Text>
            <Text className="text-xs text-text-muted">
              {myStories?.items.length
                ? `${myStories.items.length} item${myStories.items.length > 1 ? 's' : ''} · Tap to add`
                : 'Tap to add'}
            </Text>
          </View>
          {myStories?.items.length ? (
            <Button
              variant="plain"
              onPress={() => setViewer({ senderId: myStories.senderId, index: 0 })}
            >
              <Text className="text-blue-600 text-sm font-semibold">View</Text>
            </Button>
          ) : (
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          )}
        </Pressable>

        {storiesLoading && stories.length === 0 ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#1dab61" />
          </View>
        ) : otherStories.length === 0 ? (
          <View className="items-center py-10 gap-1">
            <Text className="font-semibold">No recent stories</Text>
            <Text className="text-sm text-text-muted text-center">
              When people share photos and videos, they show up here for 24 hours.
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-xs font-semibold text-gray-400 uppercase mt-6 mb-1">
              Recent
            </Text>
            {otherStories.map((author) => {
              const newest = author.items[author.items.length - 1];
              return (
                <Pressable
                  key={author.senderId}
                  onPress={() => setViewer({ senderId: author.senderId, index: 0 })}
                  className="flex-row items-center gap-3 mt-3 w-full"
                >
                  <View
                    className="rounded-full bg-blue-500 p-[3px]"
                    style={{ width: 62, height: 62 }}
                  >
                    <View className="flex-1 rounded-full bg-white p-[2px]">
                      <Avatar
                        imageUrl={author.image}
                        name={author.name || author.senderId}
                        size={56}
                        fontSize={22}
                        placeholderType="text"
                      />
                    </View>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-semibold" numberOfLines={1}>
                      {author.name || author.senderId}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {author.items.length} item{author.items.length > 1 ? 's' : ''} ·{' '}
                      {formatWhen(newest?.at || 0)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#9ca3af" />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Full-screen story viewer */}
      <Modal
        visible={Boolean(viewer && viewerItem && viewerAuthor)}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewer(null)}
      >
        {viewer && viewerItem && viewerAuthor ? (
          <View className="flex-1 bg-black">
            {viewerItem.type === 'video' ? (
              <VideoAttachment uri={viewerItem.url} style={{ flex: 1 }} />
            ) : (
              <Image
                source={{ uri: viewerItem.url }}
                style={{ flex: 1 }}
                contentFit="contain"
              />
            )}

            {/* Header */}
            <View className="absolute top-0 left-0 right-0 flex-row items-center gap-3 px-4 pt-12 pb-6 bg-black/40">
              <Avatar
                imageUrl={viewerAuthor.image}
                name={viewerAuthor.name || viewerAuthor.senderId}
                size={36}
                fontSize={15}
                placeholderType="text"
              />
              <View className="flex-1">
                <Text className="text-white font-semibold" numberOfLines={1}>
                  {viewerAuthor.mine ? 'Your story' : viewerAuthor.name || viewerAuthor.senderId}
                </Text>
                <Text className="text-white/70 text-xs">{formatWhen(viewerItem.at)}</Text>
              </View>
              <Button
                variant="plain"
                onPress={() => setViewer(null)}
                accessibilityLabel="Close story"
              >
                <Feather name="x" size={26} color="white" />
              </Button>
            </View>

            {/* Tap zones */}
            <Pressable
              onPress={showPrevious}
              style={{ position: 'absolute', left: 0, top: 100, bottom: 60, width: '35%' }}
              accessibilityLabel="Previous story item"
            />
            <Pressable
              onPress={showNext}
              style={{ position: 'absolute', right: 0, top: 100, bottom: 60, width: '65%' }}
              accessibilityLabel="Next story item"
            />

            {/* Progress dots */}
            <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-1">
              {viewerAuthor.items.map((item, index) => (
                <View
                  key={item.id}
                  className={clsx(
                    'h-1 rounded-full',
                    index === viewer.index ? 'w-5 bg-white' : 'w-2 bg-white/40'
                  )}
                />
              ))}
            </View>
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
};

export default StoriesScreen;
