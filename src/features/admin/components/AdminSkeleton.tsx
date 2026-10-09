import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function AdminSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.base, style]} />;
}

export function AdminListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.listRow}>
          <AdminSkeleton style={styles.listIcon} />
          <View style={styles.listContent}>
            <AdminSkeleton style={styles.listTitle} />
            <AdminSkeleton style={styles.listSubtitle} />
          </View>
          <AdminSkeleton style={styles.chevron} />
        </View>
      ))}
    </View>
  );
}

export function AdminMetricsSkeleton() {
  return (
    <View style={styles.metrics}>
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} style={styles.metric}>
          <AdminSkeleton style={styles.metricIcon} />
          <AdminSkeleton style={styles.metricValue} />
          <AdminSkeleton style={styles.metricLabel} />
        </View>
      ))}
    </View>
  );
}

export function AdminEditorSkeleton() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.editorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.editorHeader}>
          <AdminSkeleton style={styles.back} />
          <AdminSkeleton style={styles.editorTitle} />
        </View>
        <AdminSkeleton style={styles.field} />
        <AdminSkeleton style={styles.field} />
        <AdminSkeleton style={styles.textarea} />
        <AdminSkeleton style={styles.field} />
        <AdminSkeleton style={styles.field} />
      </ScrollView>
      <View style={styles.editorFooter}>
        <AdminSkeleton style={styles.button} />
      </View>
    </View>
  );
}

export function AdminGallerySkeleton() {
  return (
    <View style={styles.screen}>
      <View style={styles.galleryHeader}>
        <AdminSkeleton style={styles.back} />
        <AdminSkeleton style={styles.editorTitle} />
      </View>
      <ScrollView contentContainerStyle={styles.galleryContent} showsVerticalScrollIndicator={false}>
        <AdminSkeleton style={styles.heading} />
        <AdminSkeleton style={styles.copy} />
        <AdminSkeleton style={styles.galleryButton} />
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={styles.mediaRow}>
            <AdminSkeleton style={styles.mediaImage} />
            <View style={styles.listContent}>
              <AdminSkeleton style={styles.listTitle} />
              <AdminSkeleton style={styles.listSubtitle} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function AdminMediaStripSkeleton() {
  return (
    <View style={styles.mediaStrip}>
      <AdminSkeleton style={styles.mediaPreview} />
      <AdminSkeleton style={styles.mediaPreview} />
      <AdminSkeleton style={styles.mediaPreview} />
    </View>
  );
}

const styles = {
  base: { backgroundColor: '#27272A', borderRadius: 8 },
  screen: { backgroundColor: colors.background, flex: 1 },
  list: { gap: 2, paddingTop: 2 },
  listRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 12, minHeight: 62 },
  listIcon: { borderRadius: 8, height: 20, width: 20 },
  listContent: { flex: 1, gap: 7 },
  listTitle: { height: 14, width: '54%' as const },
  listSubtitle: { height: 10, width: '36%' as const },
  chevron: { height: 14, width: 8 },
  metrics: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  metric: { backgroundColor: '#18181B', borderRadius: 12, flexGrow: 1, gap: 8, minWidth: '30%' as const, padding: 14 },
  metricIcon: { borderRadius: 8, height: 18, width: 18 },
  metricValue: { height: 20, width: '55%' as const },
  metricLabel: { height: 10, width: '72%' as const },
  editorContent: { gap: 20, padding: 24, paddingBottom: 112 },
  editorHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  galleryHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  back: { borderRadius: 14, height: 25, width: 25 },
  editorTitle: { height: 20, width: 132 },
  field: { height: 48, width: '100%' as const },
  textarea: { height: 112, width: '100%' as const },
  editorFooter: { borderTopColor: colors.border, borderTopWidth: 1, padding: 16 },
  button: { borderRadius: 24, height: 48, width: '100%' as const },
  galleryContent: { gap: 14, padding: 24, paddingBottom: 40 },
  heading: { height: 18, width: 168 },
  copy: { height: 13, width: '72%' as const },
  galleryButton: { borderRadius: 24, height: 46, width: '100%' as const },
  mediaRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10, minHeight: 92 },
  mediaImage: { borderRadius: 8, height: 76, width: 76 },
  mediaStrip: { flexDirection: 'row' as const, gap: 10 },
  mediaPreview: { borderRadius: 10, height: 88, width: 88 },
} as const;
