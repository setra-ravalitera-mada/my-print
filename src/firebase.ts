import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialisation de Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export async function deleteImageFromFirebaseStorage(urlOrPath: string): Promise<void> {
  if (!urlOrPath || urlOrPath.startsWith('data:') || urlOrPath.startsWith('/src/') || urlOrPath.startsWith('blob:')) {
    return;
  }
  try {
    let path = urlOrPath;
    if (urlOrPath.includes('/o/')) {
      const encodedPath = urlOrPath.split('/o/')[1].split('?')[0];
      path = decodeURIComponent(encodedPath);
    }
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete old image from Firebase Storage:', err);
  }
}

export async function uploadImageToFirebaseStorage(
  file: File | Blob, 
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = file instanceof File ? file.name : 'image.jpg';
    const cleanName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filename = `${folder}/${timestamp}_${randomStr}_${cleanName}`;
    const storageRef = ref(storage, filename);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Firebase Storage upload failed, falling back to base64 data URL:', err);
    if (onProgress) onProgress(100);
    // Fallback to base64 if storage quota or rules prevent upload
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validation de la connexion à Firestore au démarrage (exigence critique)
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Veuillez vérifier votre configuration Firebase.');
    }
  }
}

// Exécuter le test de connexion
testConnection();
