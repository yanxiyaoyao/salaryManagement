# 个人开支记账管理系统 - API接口文档

## 1. API概述

### 1.1 基本信息

- **API基础URL**：`http://localhost:5000/api`
- **请求格式**：JSON
- **响应格式**：JSON
- **认证方式**：JWT Token（Bearer Token）
- **字符编码**：UTF-8

### 1.2 请求头

所有需要认证的请求都需要在请求头中包含JWT Token：

```
Authorization: Bearer <token>
Content-Type: application/json
```

### 1.3 响应格式

**成功响应（HTTP 200）：**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    // 业务数据
  }
}
```

**错误响应：**

```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null
}
```

### 1.4 HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（Token无效或过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如用户名已存在） |
| 500 | 服务器错误 |

### 1.5 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突 |
| 500 | 服务器错误 |

## 2. 认证接口

### 2.1 用户登录

**请求方法**：`POST`

**请求路径**：`/auth/login`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**：

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "phone": "13800138000",
      "avatar": "http://localhost:5000/staitc/avatar.jpg"
    }
  }
}
```

**错误示例**：

```json
{
  "code": 401,
  "msg": "用户名或密码错误",
  "data": null
}
```

### 2.2 用户注册

**请求方法**：`POST`

**请求路径**：`/auth/register`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，长度3-50 |
| password | string | 是 | 密码，长度6-128 |

**请求示例**：

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "123456"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "注册成功",
  "data": null
}
```

**错误示例**：

```json
{
  "code": 409,
  "msg": "用户名已被占用",
  "data": null
}
```

## 3. 交易接口

### 3.1 获取交易列表

**请求方法**：`GET`

**请求路径**：`/transactions`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20，最大100 |
| type | string | 否 | 交易类型，expense/income |
| category_id | integer | 否 | 分类ID |
| start_date | string | 否 | 开始日期，格式YYYY-MM-DD |
| end_date | string | 否 | 结束日期，格式YYYY-MM-DD |
| keyword | string | 否 | 关键词搜索（备注） |

**请求示例**：

```bash
curl -X GET "http://localhost:5000/api/transactions?page=1&size=20&type=expense" \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "items": [
      {
        "id": 1,
        "type": "expense",
        "amount": 50.00,
        "currency": "CNY",
        "occurred_on": "2024-01-15",
        "category": {
          "id": 1,
          "name": "食物",
          "type": "expense",
          "color": "#FF6B6B"
        },
        "note": "午餐",
        "tags": "饮食",
        "created_at": "2024-01-15T12:00:00",
        "updated_at": "2024-01-15T12:00:00"
      }
    ],
    "page": 1,
    "size": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 3.2 创建交易

**请求方法**：`POST`

**请求路径**：`/transactions`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 交易类型，expense/income |
| amount | number | 是 | 金额，正数，最多两位小数 |
| category_id | integer | 是 | 分类ID |
| occurred_on | string | 是 | 发生日期，格式YYYY-MM-DD |
| currency | string | 否 | 货币代码，默认CNY |
| note | string | 否 | 备注，最多500字符 |
| tags | string | 否 | 标签，多个标签用逗号分隔 |

**请求示例**：

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 50.00,
    "category_id": 1,
    "occurred_on": "2024-01-15",
    "note": "午餐",
    "tags": "饮食"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 1,
    "type": "expense",
    "amount": 50.00,
    "currency": "CNY",
    "occurred_on": "2024-01-15",
    "category": {
      "id": 1,
      "name": "食物",
      "type": "expense",
      "color": "#FF6B6B"
    },
    "note": "午餐",
    "tags": "饮食",
    "created_at": "2024-01-15T12:00:00",
    "updated_at": "2024-01-15T12:00:00"
  }
}
```

**验证规则**：

- type：必填，只能是'expense'或'income'
- amount：必填，必须是正数，最多两位小数
- category_id：必填，必须是有效的分类ID
- occurred_on：必填，必须是有效的日期格式，不能晚于今天

### 3.3 更新交易

**请求方法**：`PUT`

**请求路径**：`/transactions/:id`

**请求参数**：

同创建交易接口

**请求示例**：

```bash
curl -X PUT http://localhost:5000/api/transactions/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 60.00,
    "category_id": 1,
    "occurred_on": "2024-01-15",
    "note": "午餐",
    "tags": "饮食"
  }'
```

**响应示例**：

同创建交易接口

### 3.4 删除交易

**请求方法**：`DELETE`

**请求路径**：`/transactions/:id`

**请求示例**：

```bash
curl -X DELETE http://localhost:5000/api/transactions/1 \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

## 4. 分类接口

### 4.1 获取分类列表

**请求方法**：`GET`

**请求路径**：`/categories`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认10 |
| type | string | 否 | 分类类型，expense/income |
| kw | string | 否 | 关键词搜索（分类名称） |

**请求示例**：

```bash
curl -X GET "http://localhost:5000/api/categories?type=expense" \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "食物",
        "type": "expense",
        "color": "#FF6B6B",
        "icon": "fork-knife",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 10
  }
}
```

### 4.2 创建分类

**请求方法**：`POST`

**请求路径**：`/categories`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称，长度1-50 |
| type | string | 是 | 分类类型，expense/income |
| color | string | 否 | 分类颜色，十六进制颜色代码 |
| icon | string | 否 | 分类图标 |

**请求示例**：

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "食物",
    "type": "expense",
    "color": "#FF6B6B",
    "icon": "fork-knife"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "分类创建成功",
  "data": {
    "id": 1,
    "name": "食物",
    "type": "expense",
    "color": "#FF6B6B",
    "icon": "fork-knife",
    "created_at": "2024-01-15T12:00:00",
    "updated_at": "2024-01-15T12:00:00"
  }
}
```

**验证规则**：

- name：必填，长度1-50，同类型内唯一
- type：必填，只能是'expense'或'income'
- color：可选，有效的十六进制颜色代码

### 4.3 更新分类

**请求方法**：`PUT` 或 `PATCH`

**请求路径**：`/categories/:id`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 分类名称 |
| color | string | 否 | 分类颜色 |
| icon | string | 否 | 分类图标 |

**请求示例**：

```bash
curl -X PUT http://localhost:5000/api/categories/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "食物",
    "color": "#FF6B6B"
  }'
```

**响应示例**：

同创建分类接口

### 4.4 删除分类

**请求方法**：`DELETE`

**请求路径**：`/categories/:id`

**请求示例**：

```bash
curl -X DELETE http://localhost:5000/api/categories/1 \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

**说明**：

- 如果分类被使用（存在关联的交易），则无法删除
- 删除前请确保分类没有被使用

## 5. 统计接口

### 5.1 获取概览统计

**请求方法**：`GET`

**请求路径**：`/statistics/overview`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期，格式YYYY-MM-DD |
| end_date | string | 否 | 结束日期，格式YYYY-MM-DD |

**请求示例**：

```bash
curl -X GET "http://localhost:5000/api/statistics/overview?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "total_income": 5000.00,
    "total_expense": 3000.00,
    "balance": 2000.00,
    "transaction_count": 50
  }
}
```

### 5.2 获取分类统计

**请求方法**：`GET`

**请求路径**：`/statistics/by-category`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期，格式YYYY-MM-DD |
| end_date | string | 否 | 结束日期，格式YYYY-MM-DD |
| type | string | 否 | 交易类型，expense/income |

**请求示例**：

```bash
curl -X GET "http://localhost:5000/api/statistics/by-category?type=expense" \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "category_id": 1,
      "category_name": "食物",
      "amount": 1000.00,
      "percentage": 33.33,
      "transaction_count": 10
    },
    {
      "category_id": 2,
      "category_name": "交通",
      "amount": 800.00,
      "percentage": 26.67,
      "transaction_count": 8
    }
  ]
}
```

### 5.3 获取趋势统计

**请求方法**：`GET`

**请求路径**：`/statistics/trend`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期，格式YYYY-MM-DD |
| end_date | string | 否 | 结束日期，格式YYYY-MM-DD |
| period | string | 否 | 统计周期，daily/weekly/monthly，默认daily |

**请求示例**：

```bash
curl -X GET "http://localhost:5000/api/statistics/trend?period=daily" \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "date": "2024-01-15",
      "income": 1000.00,
      "expense": 500.00
    },
    {
      "date": "2024-01-16",
      "income": 800.00,
      "expense": 600.00
    }
  ]
}
```

## 6. 用户接口

### 6.1 获取用户信息

**请求方法**：`GET`

**请求路径**：`/users/profile`

**请求示例**：

```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": "http://localhost:5000/staitc/avatar.jpg"
  }
}
```

### 6.2 更新用户信息

**请求方法**：`PUT`

**请求路径**：`/users/profile`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 电话 |

**请求示例**：

```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "新昵称",
    "email": "newemail@example.com",
    "phone": "13900139000"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "新昵称",
    "email": "newemail@example.com",
    "phone": "13900139000",
    "avatar": "http://localhost:5000/staitc/avatar.jpg"
  }
}
```

### 6.3 上传头像

**请求方法**：`POST`

**请求路径**：`/users/avatar`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 图片文件，仅支持jpg/png，最大5MB |

**请求示例**：

```bash
curl -X POST http://localhost:5000/api/users/avatar \
  -H "Authorization: Bearer <token>" \
  -F "file=@avatar.jpg"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "avatar": "http://localhost:5000/staitc/avatar_1234567890.jpg"
  }
}
```

### 6.4 修改密码

**请求方法**：`PUT`

**请求路径**：`/users/password`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码，长度6-128 |

**请求示例**：

```bash
curl -X PUT http://localhost:5000/api/users/password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "123456",
    "new_password": "654321"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "密码修改成功",
  "data": null
}
```

## 7. 设置接口

### 7.1 获取设置

**请求方法**：`GET`

**请求路径**：`/settings`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 否 | 设置键 |

**请求示例**：

```bash
curl -X GET "http://localhost:5000/api/settings?key=currency" \
  -H "Authorization: Bearer <token>"
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "key": "currency",
      "value": "CNY"
    }
  ]
}
```

### 7.2 更新设置

**请求方法**：`PUT`

**请求路径**：`/settings/:key`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| value | string | 是 | 设置值 |

**请求示例**：

```bash
curl -X PUT http://localhost:5000/api/settings/currency \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "USD"
  }'
```

**响应示例**：

```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "key": "currency",
    "value": "USD"
  }
}
```

## 8. 常见错误

### 8.1 认证错误

**错误码**：401

**错误信息**：`未认证`

**原因**：

- Token无效或过期
- 请求头中未包含Token
- Token格式错误

**解决方案**：

- 重新登录获取新的Token
- 检查请求头格式：`Authorization: Bearer <token>`

### 8.2 参数验证错误

**错误码**：400

**错误信息**：`请求参数错误`

**原因**：

- 参数类型错误
- 参数值无效
- 必填参数缺失

**解决方案**：

- 检查参数类型和值
- 确保所有必填参数都已提供

### 8.3 资源不存在

**错误码**：404

**错误信息**：`资源不存在`

**原因**：

- 资源ID不存在
- 资源已被删除

**解决方案**：

- 检查资源ID是否正确
- 确保资源存在

### 8.4 冲突错误

**错误码**：409

**错误信息**：`用户名已被占用` 或 `同类型下已存在相同名称的分类`

**原因**：

- 用户名已被占用
- 分类名称重复

**解决方案**：

- 使用不同的用户名
- 使用不同的分类名称

## 9. 使用示例

### 9.1 完整的登录和查询流程

```bash
# 1. 登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }' > login_response.json

# 2. 提取Token
TOKEN=$(jq -r '.data.token' login_response.json)

# 3. 查询交易列表
curl -X GET "http://localhost:5000/api/transactions?page=1&size=20" \
  -H "Authorization: Bearer $TOKEN"

# 4. 创建新交易
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 50.00,
    "category_id": 1,
    "occurred_on": "2024-01-15",
    "note": "午餐"
  }'

# 5. 查询统计数据
curl -X GET "http://localhost:5000/api/statistics/overview" \
  -H "Authorization: Bearer $TOKEN"
```

### 9.2 使用Postman测试

1. **创建新的Request**
   - 选择请求方法（GET/POST/PUT/DELETE）
   - 输入请求URL
   - 添加请求头：`Authorization: Bearer <token>`
   - 添加请求体（JSON格式）

2. **保存Token**
   - 在登录请求的响应中复制Token
   - 在其他请求的Authorization头中使用

3. **测试API**
   - 点击Send按钮发送请求
   - 查看响应结果

## 10. API版本历史

### 版本 1.0.0（当前版本）

**发布日期**：2024年

**功能**：

- 用户认证（登录、注册）
- 交易管理（增删改查）
- 分类管理（增删改查）
- 统计分析（概览、分类、趋势）
- 用户管理（个人信息、头像、密码）
- 系统设置（基本设置）

**已知问题**：

- 暂无

**计划功能**：

- 数据导入导出
- 预算管理
- 提醒功能
- 多用户权限管理

---

**文档版本**：1.0.0
**最后更新**：2024年
**维护者**：开发团队
