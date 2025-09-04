import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export interface QRCodeData {
  id: number;
  type: 'student' | 'child';
  schoolId: number;
  name: string;
  code: string; // Unique identifier
  timestamp: number;
}

/**
 * Generate a unique QR code for a student or child
 */
export async function generateStudentQRCode(
  id: number,
  type: 'student' | 'child',
  schoolId: number,
  name: string
): Promise<{ qrCode: string; qrCodeData: string }> {
  // Generate unique code
  const uniqueCode = nanoid(8); // Shorter code
  
  // Create simple QR code data - just the essentials for linking
  const linkingData = `${type}:${id}:${schoolId}:${uniqueCode}`;
  
  // Store more detailed data separately
  const qrData: QRCodeData = {
    id,
    type,
    schoolId,
    name,
    code: uniqueCode,
    timestamp: Date.now()
  };
  
  // Generate QR code as data URL with the simple linking data
  const qrCodeImage = await QRCode.toDataURL(linkingData, {
    width: 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return {
    qrCode: qrCodeImage,
    qrCodeData: JSON.stringify(qrData)
  };
}

/**
 * Parse QR code data to extract student/child information
 */
export function parseQRCodeData(qrCodeData: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrCodeData);
    
    // Validate required fields
    if (!data.id || !data.type || !data.schoolId || !data.code) {
      return null;
    }
    
    return data as QRCodeData;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
}

/**
 * Verify if QR code belongs to a specific school
 */
export function verifyQRCodeSchool(qrCodeData: string, schoolId: number): boolean {
  const data = parseQRCodeData(qrCodeData);
  return data ? data.schoolId === schoolId : false;
}

/**
 * Get QR code for attendance scanning
 */
export function getAttendanceQRData(qrCodeData: string): { studentId: number; type: 'student' | 'child' } | null {
  const data = parseQRCodeData(qrCodeData);
  if (!data) return null;
  
  return {
    studentId: data.id,
    type: data.type
  };
}