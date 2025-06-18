import { type FileRouter, UploadError, storage } from '@avenire/storage';
import { auth } from '@avenire/auth/server';

export const router = {
  chatAttachments: storage({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 5,
    },
    pdf: {
      maxFileSize: '4MB',
      maxFileCount: 3,
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: '4MB',
      maxFileCount: 3,
    },
    "text/markdown": {
      maxFileSize: '4MB',
      maxFileCount: 3,
    },
    text: {
      maxFileSize: '4MB',
      maxFileCount: 3,
    },
    "text/csv": {
      maxFileSize: '4MB',
      maxFileCount: 3,
    },
  })
    .middleware(async ({ req }) => {
      const data = await auth.api.getSession({
        headers: req.headers
      });

      if (!data?.user || !data.user.id) {
        throw new UploadError('Unauthorized');
      }

      return { userId: data?.user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.info("Upload complete for userId:", metadata.userId);
      console.info("file url", file.ufsUrl);
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    })
} satisfies FileRouter;

export type Router = typeof router
