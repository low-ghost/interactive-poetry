import { decryptString } from '@utils/encryption';

// Temporarily using plaintext for debugging
const ENCRYPTED_POEM =
  'J1hWGlIYfxhHFi1fEFFaHVVAVBMVM0tSDX9dXlFQUERbEVIYLQxGHC1BEFpaHFQ5ABocNhkTGy1XUUZdXhBkHBcNNw5BWTBAEFxaBBBHHBcAfx5dHTpAQ0ZUHlQTGxwcVQpdFitaVUAZUERbEVIcOwxWCn9dVhJUUFZcBh8cLQdKWTFbU1cVFFFKVBEYMQVcDVVBRFNBGV9dVB4QNA4TGH9BVUYVH1YTBwcXMRITCT5AVVxBGFVAEQFZPhlcDDFWEFNbCTpcGhdZNg9WGHESY10VB1hc4oGtHhV/GVoKNBJFRkEVQloaFVksBF4cf0JYQFQDVRMAGhx/BEcROkA6X1wXWEdUGhgrDgxZDEdUVlAeEFsBHxgxS1AWMVxVUUEZX13igaB4FCoIW1kzW1tXFREQfhULWSsDRhc7V0JBWx9H4oCqB1IKNwJVDTpWEFFaBUJAEXgWLUtHEToSQkdGGBBbGwcLfx9BGDlUWVEVAlVDGwAN4oGLCFIXMV1EOFcVEEMGFx02CEccOxJSSxUVSEMRAA0sS0cWf1dGV0cJX10R4oGrCn8HWhI2XFccPz5fExscHOKBhhgTDTpeXFtbFxBHHBdZKwRBFz5WX+KAq0ZQVlwGBgwxDh1zEV0QXVsV4oCpQFQTHSkCQBAxVRBGXRUQXx0VESsFWhc4EkdaUAJVEwAdWSwfQRA0Vx44YRhZQFQbCn8DXA5/exBHWxRVQQcGGDEPExgxElFAUgVdVhoGcysEEw4wQFsIFQRHXFQdC38GXAs6EkBXWgBcVlQUGDMHWhc4HjpfWgJVExgbEjpLXB85H1NdQAJDVlQCGC0KUBEqRllBQQM6RxwTF38KXQB/RVVTQRhVQVQCEToFXBQ6XFEeFRZfQRcXHVUfXFkzU15WFR9eEwAaHH8ZXBY5El9UFRxRXRMHGDgOH1k7QF9CRx9cX1h4DTcOXVkoXV5WUAIQRBwTDeKBhhgTETBeVFtbFxBHHBcUfx5DWStdQBw/JFhWGlIOMAVXHC0SR1pMUFETEgAYPB9SFX9FX0dZFBBVFR4VfwpdHX9VXFtBBFVBfhNZPARfHX9RWFdQGxBZAQENfxxbHDESRFpQCRBRGwYRfxxWCzoSUVBaBUQTAB1ZLApKWTddRzhXFVFGABsfKgcdWRYSXVdUHhBbGwVZLB9GCTZWHhJ8UF1WFRxZMwpdHipTV1cVGFFAVBwWfxlcFjkc';
const POEM = decryptString(ENCRYPTED_POEM, 'p03try_k3y_2025');

export const POEM_LINES = POEM.split('\n');
