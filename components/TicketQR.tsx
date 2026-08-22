import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';

interface TicketQRProps {
  qrHash: string;
  size?: number;
}

export const TicketQR: React.FC<TicketQRProps> = ({ qrHash, size = 180 }) => {
  // Generate deterministically styled SVG matrix patterns based on qrHash string
  const generateMatrix = (str: string) => {
    const grid = 15;
    const cells = [];
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
      seed += str.charCodeAt(i);
    }

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        // Corner position markers
        if (
          (r < 4 && c < 4) ||
          (r < 4 && c >= grid - 4) ||
          (r >= grid - 4 && c < 4)
        ) {
          cells.push(true);
        } else {
          const val = (r * grid + c + seed) % 3;
          cells.push(val === 0 || val === 1);
        }
      }
    }
    return { grid, cells };
  };

  const { grid, cells } = generateMatrix(qrHash);
  const cellSize = size / grid;

  return (
    <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill="#FFFFFF" rx={8} />
        {cells.map((active, index) => {
          if (!active) return null;
          const r = Math.floor(index / grid);
          const c = index % grid;
          return (
            <Rect
              key={index}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize - 0.5}
              height={cellSize - 0.5}
              fill="#09090B"
            />
          );
        })}
      </Svg>
      <Text style={styles.hashText} numberOfLines={1}>
        {qrHash}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(124, 58, 237, 0.25)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
    }),
  },
  hashText: {
    color: '#3F3F46',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 6,
    textAlign: 'center',
  },
});

