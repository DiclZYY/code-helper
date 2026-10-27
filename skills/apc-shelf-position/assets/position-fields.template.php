<?php
/**
 * 位置三字段收口模板（精简自 CustodyArchiveBoxRepository）
 * 所有写位置入口（新增/编辑/导入/移动/批量分配）必须先调用 normalizePositionPayload。
 */

/**
 * 保存前统一 position / position_mjj / position_mjj_inner。
 */
private function normalizePositionPayload(array $data): array
{
    $hasPosition = array_key_exists('position', $data);
    $hasMjj = array_key_exists('position_mjj', $data);
    $hasInner = array_key_exists('position_mjj_inner', $data);
    if (!$hasPosition && !$hasMjj && !$hasInner) {
        return $data;
    }

    $mjjId = $hasMjj ? (int) ($data['position_mjj'] ?? 0) : 0;
    $inner = ($hasInner && is_array($data['position_mjj_inner'])) ? $data['position_mjj_inner'] : null;

    // 1) ID + 架内坐标：最可靠
    if ($mjjId > 0 && is_array($inner) && count($inner) >= 3) {
        return array_merge($data, $this->buildPositionFields(
            $mjjId,
            (string) ($inner[0] ?? 'A'),
            (int) ($inner[1] ?? 1),
            (int) ($inner[2] ?? 1)
        ));
    }

    // 2) 只有位置字符串：反查列节点
    if ($hasPosition) {
        $position = trim((string) ($data['position'] ?? ''));
        if ($position !== '' && $mjjId <= 0) {
            $repo = ServiceFactory::custodyCleverShelf();
            $pathMap = $this->buildShelfPathMap($repo->getAll(), $repo);
            $resolvedMjj = $this->resolveMjjIdFromPositionString($position, $pathMap);
            $resolvedInner = $this->parsePositionInnerFromString($position);
            if ($resolvedMjj !== null && $resolvedInner !== null) {
                return array_merge($data, $this->buildPositionFields(
                    $resolvedMjj,
                    $resolvedInner[0],
                    $resolvedInner[1],
                    $resolvedInner[2]
                ));
            }
        }
    }

    return $data;
}

/**
 * ID + 面/组/层 → 三字段。
 *
 * @return array{position: string, position_mjj: int, position_mjj_inner: array}
 */
private function buildPositionFields(int $mjjId, string $mian, int $group, int $layer): array
{
    $inner = [strtoupper($mian), $group, $layer];

    return [
        'position' => $this->buildPositionString($mjjId, $inner),
        'position_mjj' => $mjjId,
        'position_mjj_inner' => $inner,
    ];
}

/**
 * 完整位置字符串：库名+区名+列名+面+组+层（分隔符传空）。
 */
private function buildPositionString(int $mjj, array $inner): string
{
    if (empty($mjj)) {
        return '';
    }
    $path = ServiceFactory::custodyCleverShelf()->name($mjj, null, '');
    if ($path === '' || count($inner) < 3) {
        return $path;
    }

    return $path . sprintf('%s面%d组%d层', strtoupper($inner[0]), $inner[1], $inner[2]);
}

/**
 * 字符串 → [面, 组, 层]
 */
private function parsePositionInnerFromString(string $position): ?array
{
    if (!preg_match('/([A-Za-z]+)面/u', $position, $m)
        || !preg_match('/(\d+)组/u', $position, $g)
        || !preg_match('/(\d+)层/u', $position, $l)) {
        return null;
    }

    return [strtoupper($m[1]), (int) $g[1], (int) $l[1]];
}

/**
 * 字符串 → 列节点 ID（含小写 / 去前导零回退）。
 */
private function resolveMjjIdFromPositionString(string $position, array $pathMap): ?int
{
    if (!preg_match('/^([A-Za-z0-9]+库)([A-Za-z]+区)(\d+)列/u', $position, $m)) {
        return null;
    }
    $path = $m[1] . '/' . strtoupper($m[2]) . '/' . str_pad($m[3], 2, '0', STR_PAD_LEFT) . '列';

    return $pathMap[$path]
        ?? $pathMap[strtolower($path)]
        ?? null;
}

/**
 * 配置节点创建：pid 由 id_path 末位推导，顶级为 0。
 */
public function create(array $data): object
{
    $idPath = isset($data['id_path']) && is_array($data['id_path'])
        ? array_values(array_filter($data['id_path']))
        : [];
    $data['id_path'] = $idPath;
    $data['pid'] = empty($idPath) ? 0 : end($idPath);

    return parent::create($data);
}
