/**
 * UI组件库入口文件
 * 统一导出所有通用UI组件
 */

// 加载器组件
export { 
  Spinner,
  LoadingIndicator,
  PageLoader,
  ContentLoader,
  ButtonLoader,
  TableLoader,
  CardLoader
} from './Loaders'

// 错误组件
export {
  ErrorMessage,
  NetworkError,
  FormError,
  ApiError
} from './Errors'

// 表单组件
export {
  TextInput,
  TextArea,
  Select,
  Checkbox,
  FormContainer,
  validators,
  formatters,
  formPresets
} from './Forms'

// 通知组件
export {
  NotificationProvider,
  NotificationContainer,
  useNotification,
  useToast
} from './Notifications'

// 类型定义
export type { Notification, NotificationType } from './Notifications'
export type { FormFieldConfig, FormErrors, FormState } from '@/hooks/useForm'

// 默认导出
import * as Loaders from './Loaders'
import * as Errors from './Errors'
import * as Notifications from './Notifications'

export default {
  Loaders,
  Errors,
  Notifications
}