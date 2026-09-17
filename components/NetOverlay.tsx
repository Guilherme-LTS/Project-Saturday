import React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';

interface NetOverlayProps {
  width: number;
  height?: number;
  meshColumns?: number;
  meshRows?: number;
  topOverhang?: number;
  color?: string;
  postColor?: string;
}

const NetOverlay: React.FC<NetOverlayProps> = ({
  width,
  height = 30,
  meshColumns = 40,
  meshRows = 6,
  topOverhang = 0,
  color = '#ffffff',
  postColor = '#f2f2f2',
}) => {
  if (!width || width <= 0) return null;

  const postWidth = Math.max(3, width * 0.012);
  const tapeHeight = 1.5;
  const meshEnd = height * 0.60;
  const meshHeight = meshEnd - tapeHeight;
  const svgWidth = width + topOverhang * 2;
  const topMeshColumns = Math.max(1, Math.round(meshColumns * 1));

  const verticalLines = [];
  for (let rowIndex = 0; rowIndex < meshRows; rowIndex++) {
    const rowStart = rowIndex / meshRows;
    const rowEnd = (rowIndex + 1) / meshRows;
    const y1 = tapeHeight + rowStart * meshHeight;
    const y2 = tapeHeight + rowEnd * meshHeight;
    const columnProgress = rowIndex / Math.max(1, meshRows - 1);
    const rowColumns = Math.round(
      topMeshColumns + columnProgress * (meshColumns - topMeshColumns)
    );
    const topLeft = topOverhang * (y1 / height);
    const topRight = svgWidth - topLeft;
    const bottomLeft = topOverhang * (y2 / height);
    const bottomRight = svgWidth - bottomLeft;

    for (let columnIndex = 0; columnIndex <= rowColumns; columnIndex++) {
      const progress = columnIndex / rowColumns;
      verticalLines.push(
        <Line
          key={`v-${rowIndex}-${columnIndex}`}
          x1={topLeft + progress * (topRight - topLeft)}
          y1={y1}
          x2={bottomLeft + progress * (bottomRight - bottomLeft)}
          y2={y2}
          stroke={color}
          strokeWidth={0.6}
          opacity={0.55}
        />
      );
    }
  }

  const horizontalLines = [];
  for (let j = 0; j <= meshRows; j++) {
    const progress = j / meshRows;
    const y = tapeHeight + progress * meshHeight;
    const leftX = topOverhang * (y / height);
    const rightX = svgWidth - leftX;
    horizontalLines.push(
      <Line
        key={`h-${j}`}
        x1={leftX}
        y1={y}
        x2={rightX}
        y2={y}
        stroke={color}
        strokeWidth={0.6}
        opacity={0.55}
      />
    );
  }

  return (
    <Svg width={svgWidth} height={height} viewBox={`0 0 ${svgWidth} ${height}`}>
      <Rect x={0} y={0} width={svgWidth} height={tapeHeight} fill={color} />
      {verticalLines}
      {horizontalLines}
      <Line
        x1={0}
        y1={0}
        x2={topOverhang}
        y2={height}
        stroke={postColor}
        strokeWidth={postWidth}
      />
      <Line
        x1={svgWidth}
        y1={0}
        x2={svgWidth - topOverhang}
        y2={height}
        stroke={postColor}
        strokeWidth={postWidth}
      />
    </Svg>
  );
};

export default NetOverlay;
