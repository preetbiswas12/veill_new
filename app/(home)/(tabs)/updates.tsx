import { Feather, Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { ScreenHeader } from '@/components/ScreenHeader';
import VideoAttachment from '@/components/VideoAttachment';
import { OutgoingMedia, useCometChat } from '@/hooks/useCometChat';

/** The design shows relative time under a status ("4h ago"), not a clock. */
const formatWhen = (timestamp: number): string => {
  if (!timestamp) return '';
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const StoriesScreen = () => {
  const router = useRouter();
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
      className={clsx('rounded-full p-[3px]', hasItems ? 'bg-primary' : 'bg-surface-muted')}
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
    <Screen className="bg-white" edges={['left', 'right', 'bottom']}>
      {/* Header from the Figma Header component: 28pt circular controls. */}
      <ScreenHeader
        left={<AppMenu />}
        right={
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => void addStory()}
              accessibilityRole="button"
              accessibilityLabel="Add a status update"
              className="h-7 w-7 rounded-full bg-surface-cta items-center justify-center active:opacity-60"
            >
              <Ionicons name="camera-outline" size={22} color="#0a0a0a" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/new-group')}
              accessibilityRole="button"
              accessibilityLabel="New group"
              className="h-7 w-7 rounded-full bg-surface-cta items-center justify-center active:opacity-60"
            >
              <Ionicons name="create-outline" size={20} color="#0a0a0a" />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block: 33.33pt bold, matching the chat list. */}
        <View className="pt-[5px] pb-2 px-4">
          <Text className="text-display font-bold text-text-strong">Updates</Text>
        </View>

        <View className="gap-6">
          {/* My update - Status */}
          <View className="gap-[13px]">
            <View className="h-[25px] px-4 justify-center">
              <Text className="text-[18.33px] font-semibold text-text-strong">Status</Text>
            </View>
            <Pressable
              onPress={() =>
                myStories?.items.length
                  ? setViewer({ senderId: myStories.senderId, index: 0 })
                  : void addStory()
              }
              accessibilityRole="button"
              accessibilityLabel="My status"
              className="flex-row items-center gap-[9px] pl-[15px] pr-4 active:opacity-70"
            >
              <View>
                {storyRing(Boolean(myStories?.items.length), 64)}
                {!myStories?.items.length ? (
                  <View className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border-[3px] border-white bg-primary items-center justify-center">
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </View>
                ) : null}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-body-1 font-semibold text-text-strong" numberOfLines={1}>
                  My status
                </Text>
                <Text className="text-body-2 text-text-muted" numberOfLines={1}>
                  {myStories?.items.length ? 'Tap to view your updates' : 'Add to my status'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Recent updates */}
          <View className="gap-[13px]">
            <View className="px-4">
              <Text className="text-[15.8px] font-semibold text-text-muted">Recent updates</Text>
            </View>

            {storiesLoading && stories.length === 0 ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#1dab61" />
              </View>
            ) : otherStories.length === 0 ? (
              <View className="items-center py-8 gap-1 px-8">
                <Text className="text-body-1 font-semibold text-text-strong">
                  No recent updates
                </Text>
                <Text className="text-body-2 text-text-muted text-center">
                  When people share photos and videos, they show up here for 24 hours.
                </Text>
              </View>
            ) : (
              otherStories.map((author) => {
                const newest = author.items[author.items.length - 1];
                return (
                  <Pressable
                    key={author.senderId}
                    onPress={() => setViewer({ senderId: author.senderId, index: 0 })}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${author.name || author.senderId}'s updates`}
                    className="flex-row items-center gap-3 pl-4 pr-4 active:bg-surface-muted"
                  >
                    {storyRing(true, 56)}
                    <View className="flex-1 min-w-0 py-3">
                      <Text className="text-body-1 text-text-strong" numberOfLines={1}>
                        {author.name || author.senderId}
                      </Text>
                      <Text className="text-body-2 text-text-muted">
                        {formatWhen(newest?.at || 0)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Channels */}
          <View className="gap-4">
            <View className="h-[25px] px-4 justify-center">
              <Text className="text-[18.33px] font-semibold text-text-strong">Channels</Text>
            </View>
            <View className="gap-4">
              <Text className="text-body-2 text-text-muted">
                Stay updated on topics that matter to you. Find channels to follow below.
              </Text>
              <Pressable
                onPress={() => router.push('/communities')}
                accessibilityRole="button"
                accessibilityLabel="Find channels to follow"
                className="flex-row items-center gap-2.5 active:opacity-70"
              >
                <Text className="flex-1 text-[15.8px] font-semibold text-text-muted">
                  Find channels to follow
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#767779" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/communities')}
                accessibilityRole="button"
                accessibilityLabel="Explore more"
                className="self-start px-4 py-2 rounded-full bg-primary active:opacity-80"
              >
                <Text className="text-body-1 text-white">Explore more</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
                <Ionicons name="close" size={26} color="#ffffff" />
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
