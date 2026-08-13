import { Note, GoogleUser } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DRIVE_FOLDER_NAME = 'CloudNotes_Backup';
const DATA_FILE_NAME = 'CloudNotes_Data.json';

const GOOGLE_CLIENT_ID = '181448808743-ngni7f8idk0t33s2b5h38sed4ivhfvsu.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyATYfAd2k7Q0Im8XPeWx7X3maGdp0RD7Kc';

export class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private isGapiLoaded = false;
  private isGsiLoaded = false;

  public async initializeScripts(): Promise<boolean> {
    return new Promise((resolve) => {
      let checkCount = 0;
      const interval = setInterval(() => {
        checkCount++;
        if (window.gapi && window.google?.accounts?.oauth2) {
          this.isGapiLoaded = true;
          this.isGsiLoaded = true;
          clearInterval(interval);
          resolve(true);
        }
        if (checkCount > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });
  }

  public async initClient(): Promise<boolean> {
    const scriptsReady = await this.initializeScripts();
    if (!scriptsReady) {
      console.warn('Google API scripts not available. Operating in Demo Mode.');
      return false;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
      return true;
    } catch (err) {
      console.error('Failed to initialize GAPI client:', err);
      return false;
    }
  }

  public requestAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google GIS script not loaded'));
        return;
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (response: any) => {
          if (response.error) {
            reject(response);
            return;
          }
          this.accessToken = response.access_token;
          if (window.gapi?.client) {
            window.gapi.client.setToken({ access_token: response.access_token });
          }
          resolve(response.access_token);
        },
      });

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  public restoreSession(accessToken: string) {
    this.accessToken = accessToken;
    if (window.gapi?.client) {
      window.gapi.client.setToken({ access_token: accessToken });
    }
  }

  public async getUserProfile(accessToken: string): Promise<GoogleUser | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        name: data.name || data.email || 'Google 使用者',
        email: data.email || '',
        picture: data.picture || '',
        accessToken,
      };
    } catch (err) {
      console.error('Error fetching Google profile:', err);
      return null;
    }
  }

  private async getOrCreateAppFolder(): Promise<string> {
    const res = await window.gapi.client.drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${DRIVE_FOLDER_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = res.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }

    // Create folder
    const createRes = await window.gapi.client.drive.files.create({
      resource: {
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      },
      fields: 'id',
    });

    return createRes.result.id;
  }

  public async syncNotesToDrive(notes: Note[]): Promise<boolean> {
    if (!this.accessToken || !window.gapi?.client?.drive) {
      throw new Error('Google Drive API 未連接或權限尚未授權');
    }

    try {
      const folderId = await this.getOrCreateAppFolder();

      // Check if CloudNotes_Data.json exists inside the folder
      const fileListRes = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name = '${DATA_FILE_NAME}' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const existingFiles = fileListRes.result.files;
      const fileContent = JSON.stringify({
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        notes,
      }, null, 2);

      if (existingFiles && existingFiles.length > 0) {
        // Update existing file
        const fileId = existingFiles[0].id;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        });
      } else {
        // Create new file
        const metadata = {
          name: DATA_FILE_NAME,
          mimeType: 'application/json',
          parents: [folderId],
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form,
        });
      }

      return true;
    } catch (err) {
      console.error('Error syncing notes to Drive:', err);
      throw err;
    }
  }

  public async fetchNotesFromDrive(): Promise<Note[] | null> {
    if (!this.accessToken || !window.gapi?.client?.drive) {
      return null;
    }

    try {
      const folderId = await this.getOrCreateAppFolder();
      const fileListRes = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name = '${DATA_FILE_NAME}' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const existingFiles = fileListRes.result.files;
      if (!existingFiles || existingFiles.length === 0) {
        return null;
      }

      const fileId = existingFiles[0].id;
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.notes || null;
    } catch (err) {
      console.error('Error downloading notes from Drive:', err);
      return null;
    }
  }
}

export const driveService = new GoogleDriveService();
