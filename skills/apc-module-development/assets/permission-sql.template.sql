-- =============================================================================
-- apc 模块权限节点插入模板（PostgreSQL）
-- =============================================================================
-- 使用说明：
--   1. 把 <Module> / <module> 替换为实际模块名（PascalCase / 小写）
--   2. 按需增删子权限（detail / data / import / export 等）
--   3. sort 按侧栏排序与现有菜单错开（如 99 / 98）
--   4. group 按现网用户组调整（多为 '[1]'）
--   5. 上线前在测试库执行验证，permit 唯一约束会阻止重复执行
-- =============================================================================

DO $$
DECLARE
    pid_<module> INT;
BEGIN

    -- 一级模块（type = 1，pid = 0，id_path = '[]'）
    INSERT INTO permission (type, pid, id_path, name, permit, pre, sort, "group")
    VALUES (1, 0, '[]', 'menu.<module>.manage', '<module>.manage', '', 99, '[1]');

    -- 必须在子节点插入前取 lastval()，否则会被子行覆盖
    SELECT lastval() INTO pid_<module>;

    -- 子权限：detail（type = 2）
    INSERT INTO permission (type, pid, id_path, name, permit, pre, sort, "group")
    VALUES (2, pid_<module>, ('[' || pid_<module> || ']')::json, 'menu.<module>.detail', '<module>.detail', '', 99, '[1]');

    -- 子权限：data（list 入口，pre = '<module>.detail'，与现网「项目管理」一致）
    INSERT INTO permission (type, pid, id_path, name, permit, pre, sort, "group")
    VALUES (2, pid_<module>, ('[' || pid_<module> || ']')::json, 'menu.<module>.index', '<module>.data', '<module>.detail', 99, '[1]');

    -- 子权限：import（按需启用）
    -- INSERT INTO permission (type, pid, id_path, name, permit, pre, sort, "group")
    -- VALUES (2, pid_<module>, ('[' || pid_<module> || ']')::json, 'menu.<module>.import', '<module>.import', '<module>.detail', 99, '[1]');

    -- 子权限：export（按需启用）
    -- INSERT INTO permission (type, pid, id_path, name, permit, pre, sort, "group")
    -- VALUES (2, pid_<module>, ('[' || pid_<module> || ']')::json, 'menu.<module>.export', '<module>.export', '<module>.detail', 99, '[1]');

END $$;