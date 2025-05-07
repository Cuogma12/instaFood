import { Timestamp } from '@react-native-firebase/firestore';
import moment from 'moment';
// Cài đặt locale trực tiếp thay vì import
import 'moment/locale/vi';

/**
 * Hàm chuyển đổi đối tượng Timestamp của Firebase hoặc Date thành đối tượng Date tiêu chuẩn
 * @param timestampOrDate Đối tượng có thể là Timestamp hoặc Date
 * @returns Đối tượng Date
 */
export function toJSDate(timestampOrDate: Timestamp | Date | unknown): Date {
  // Kiểm tra xem đối tượng có phải là Timestamp không
  if (timestampOrDate && typeof (timestampOrDate as any).toDate === 'function') {
    return (timestampOrDate as Timestamp).toDate();
  }
  
  // Nếu là Date hoặc kiểu không xác định, trả về đối tượng như vốn có
  // hoặc tạo Date mới nếu giá trị không hợp lệ
  if (timestampOrDate instanceof Date) {
    return timestampOrDate;
  }
  
  // Trả về thời gian hiện tại nếu giá trị null hoặc không hợp lệ
  return new Date();
}

/**
 * Format một timestamp/date thành chuỗi "thời gian trước đây" (VD: "5 phút trước")
 * @param timestampOrDate Timestamp hoặc Date cần format
 * @param locale Mã địa phương (mặc định: 'vi')
 * @returns Chuỗi thời gian đã định dạng
 */
export function formatTimeAgo(timestampOrDate: Timestamp | Date | unknown, locale: string = 'vi'): string {
  if (!timestampOrDate) return '';
  
  // Đặt locale trực tiếp
  moment.locale(locale);
  return moment(toJSDate(timestampOrDate)).fromNow();
}