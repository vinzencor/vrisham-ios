import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from './config';

// Generic type for Firestore collections
type CollectionType =
  | 'Categories'
  | 'OnlinePayStatus'
  | 'DeleteAccountRequest'
  | 'OrderExportHistory'
  | 'Orders'
  | 'Pincodes'
  | 'Products'
  | 'Returns'
  | 'Support'
  | 'Transactions'
  | 'Users'
  | 'Conversations'
  | 'FF_Push_Notifications'
  | 'MessageUpdates'
  | 'TempOrders'
  | 'Farmers'
  | 'VariationTypes'
  | 'Coupons';

/**
 * Get a reference to a Firestore collection
 */
export const getCollection = <T = DocumentData>(collectionName: CollectionType): CollectionReference<T> => {
  return collection(db, collectionName) as CollectionReference<T>;
};

/**
 * Get a document reference by ID
 */
export const getDocRef = <T = DocumentData>(collectionName: CollectionType, docId: string): DocumentReference<T> => {
  return doc(db, collectionName, docId) as DocumentReference<T>;
};

/**
 * Get a document by ID
 */
export const getDocument = async <T = DocumentData>(collectionName: CollectionType, docId: string): Promise<T | null> => {
  const docRef = getDocRef<T>(collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  } else {
    return null;
  }
};

/**
 * Query documents from a collection
 */
export const queryDocuments = async <T = DocumentData>(
  collectionName: CollectionType,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> => {
  const collectionRef = getCollection<T>(collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
};

/**
 * Add a new document to a collection
 */
export const addDocument = async <T = DocumentData>(
  collectionName: CollectionType,
  data: WithFieldValue<T>
): Promise<string> => {
  const collectionRef = getCollection(collectionName);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

/**
 * Set a document with a specific ID
 */
export const setDocument = async <T = DocumentData>(
  collectionName: CollectionType,
  docId: string,
  data: WithFieldValue<T>
): Promise<void> => {
  const docRef = getDocRef(collectionName, docId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp()
  });
};

/**
 * Update an existing document
 */
export const updateDocument = async <T = DocumentData>(
  collectionName: CollectionType,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = getDocRef(collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  collectionName: CollectionType,
  docId: string
): Promise<void> => {
  const docRef = getDocRef(collectionName, docId);
  await deleteDoc(docRef);
};

/**
 * Get all documents from a collection
 */
export const getAllDocuments = async <T = DocumentData>(
  collectionName: CollectionType
): Promise<T[]> => {
  try {
    console.log(`Attempting to fetch all documents from collection: ${collectionName}`);
    const collectionRef = getCollection<T>(collectionName);
    const querySnapshot = await getDocs(collectionRef);

    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    console.log(`Successfully fetched ${documents.length} documents from ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`Error getting all documents from ${collectionName}:`, error);
    console.error('Firestore error details:', {
      message: error.message,
      code: error.code,
      customData: error.customData
    });
    throw error;
  }
};
