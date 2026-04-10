export interface SecurityInputField {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password';
  helperText?: string;
  required?: boolean;
}

export interface SecurityCheckboxField {
  id: string;
  label: string;
  defaultChecked?: boolean;
  helperText?: string;
}

export const encryptPasswordFields: SecurityInputField[] = [
  {
    id: 'encrypt-user-password',
    label: 'User Password (Required)',
    placeholder: 'Password to open PDF',
    type: 'password',
    required: true,
  },
  {
    id: 'encrypt-owner-password',
    label: 'Owner Password (Optional)',
    placeholder: 'Password for permissions',
    type: 'password',
  },
];

export const permissionsPasswordFields: SecurityInputField[] = [
  {
    id: 'permissions-user-password',
    label: 'New User Password',
    placeholder: 'Enter new user password (optional)',
    type: 'password',
    helperText: 'Leave blank to remove encryption',
  },
  {
    id: 'permissions-owner-password',
    label: 'New Owner Password',
    placeholder: 'Enter new owner password (optional)',
    type: 'password',
    helperText: 'Defaults to user password if not set',
  },
];

export const permissionsCheckboxFields: SecurityCheckboxField[] = [
  { id: 'permissions-allow-print', label: 'Allow Printing', defaultChecked: true },
  { id: 'permissions-allow-modify', label: 'Allow Modifications', defaultChecked: true },
  { id: 'permissions-allow-copy', label: 'Allow Content Copying', defaultChecked: true },
  { id: 'permissions-allow-annotate', label: 'Allow Annotations', defaultChecked: true },
];

export const metadataRemovalFields: Array<
  SecurityCheckboxField & { title: string; description: string }
> = [
  {
    id: 'remove-document-info',
    label: 'Remove Document Information',
    title: 'Remove Document Information',
    description: 'Title, Author, Subject, Keywords, Creator, Producer',
    defaultChecked: true,
  },
  {
    id: 'remove-xmp-metadata',
    label: 'Remove XMP Metadata',
    title: 'Remove XMP Metadata',
    description: 'Extended metadata streams and custom properties',
    defaultChecked: true,
  },
  {
    id: 'remove-piece-info',
    label: 'Remove Private Application Data',
    title: 'Remove Private Application Data',
    description: 'PieceInfo and application-specific data',
    defaultChecked: true,
  },
  {
    id: 'remove-document-ids',
    label: 'Remove Document IDs',
    title: 'Remove Document IDs',
    description: 'Unique identifiers for tracking',
    defaultChecked: true,
  },
];

export const editMetadataFields: SecurityInputField[] = [
  { id: 'edit-meta-title', label: 'Title', placeholder: 'Document title' },
  { id: 'edit-meta-author', label: 'Author', placeholder: 'Author name' },
  { id: 'edit-meta-subject', label: 'Subject', placeholder: 'Document subject' },
  {
    id: 'edit-meta-keywords',
    label: 'Keywords',
    placeholder: 'keyword1, keyword2, keyword3',
    helperText: 'Separate keywords with commas',
  },
  { id: 'edit-meta-creator', label: 'Creator', placeholder: 'Creating application' },
  { id: 'edit-meta-producer', label: 'Producer', placeholder: 'PDF producer' },
];
