# Implementation Plan - Firebase Storage Integration for Unlimited Image Uploads

Integrate Firebase Storage into the application to allow users to upload, store, and manage a large volume of high-resolution images (up to 1GB+) across all sections (events, products, company profile, hero banners) without hitting Firestore document size limitations.

## Proposed Changes

### 1. Firebase Storage Initialization (`src/services/firebase.ts`)
- Initialize `getStorage(app)` and export `storage`.
- Ensure robust error handling for storage operations.

### 2. Storage Helper Utilities (`src/services/storageService.ts`)
- Create `uploadImageToStorage(file: File, folder: string): Promise<string>` which:
  - Validates file type and size (up to 15MB per file).
  - Generates a unique filename using timestamp and random hash.
  - Uploads the file to Firebase Storage (`ref(storage, \`\${folder}/\${filename}\`)`).
  - Returns the public download URL (`getDownloadURL`).

### 3. Update Admin Portal & Image Upload Handlers (`src/components/AdminPortal.tsx`)
- Update image upload handlers for:
  - Event slides (`handleEventImageFileUpload`)
  - Product catalog (`handleProductImageUpload` or product image editing)
  - Company logo (`handleCompanyLogoUpload`)
  - Hero banner image (`handleHeroImageUpload`)
- Instead of storing heavy base64 strings, upload files directly to Firebase Storage and store the resulting download URLs in the config/product states.

## Verification Plan

### Automated Tests
- Run `compile_applet` and `lint_applet` to verify zero TypeScript errors and correct imports.

### Manual Verification
- Test image uploading in Admin Portal for events, products, and company profile.
- Verify that images are correctly stored in Firebase Storage and displayed across the storefront.
