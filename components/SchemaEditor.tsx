'use client';

import { useState, useEffect } from 'react';
import { Edit3, Save, Plus, Trash2, ChevronDown, ChevronRight, Upload, Download } from 'lucide-react';

interface SchemaEditorProps {
  schemaMetadata: any;
  onSchemaUpdate: (schema: any) => void;
  onSchemaSave: (schema: any) => void;
}

export function SchemaEditor({ schemaMetadata, onSchemaUpdate, onSchemaSave }: SchemaEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchema, setEditedSchema] = useState(schemaMetadata);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    setEditedSchema(schemaMetadata);
  }, [schemaMetadata]);

  const handleSave = () => {
    onSchemaSave(editedSchema);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSchema(schemaMetadata);
    setIsEditing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const schema = JSON.parse(e.target?.result as string);
          setEditedSchema(schema);
          onSchemaUpdate(schema);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(editedSchema, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `schema-${editedSchema.database || 'database'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const addCollection = () => {
    const collectionName = prompt('Enter collection name:');
    if (collectionName && !editedSchema.schema_json[collectionName]) {
      setEditedSchema({
        ...editedSchema,
        schema_json: {
          ...editedSchema.schema_json,
          [collectionName]: {
            _id: "ObjectId",
            name: "string"
          }
        },
        collection_descriptions: {
          ...editedSchema.collection_descriptions,
          [collectionName]: "New collection"
        },
        field_descriptions: {
          ...editedSchema.field_descriptions,
          [collectionName]: {
            _id: "Unique identifier",
            name: "Name field"
          }
        }
      });
    }
  };

  const removeCollection = (collectionName: string) => {
    if (confirm(`Are you sure you want to remove collection "${collectionName}"?`)) {
      const newSchema = { ...editedSchema };
      delete newSchema.schema_json[collectionName];
      delete newSchema.collection_descriptions[collectionName];
      delete newSchema.field_descriptions[collectionName];
      setEditedSchema(newSchema);
    }
  };

  const updateCollectionDescription = (collectionName: string, description: string) => {
    setEditedSchema({
      ...editedSchema,
      collection_descriptions: {
        ...editedSchema.collection_descriptions,
        [collectionName]: description
      }
    });
  };

  const updateFieldDescription = (collectionName: string, fieldName: string, description: string) => {
    setEditedSchema({
      ...editedSchema,
      field_descriptions: {
        ...editedSchema.field_descriptions,
        [collectionName]: {
          ...editedSchema.field_descriptions[collectionName],
          [fieldName]: description
        }
      }
    });
  };

  const addField = (collectionName: string) => {
    const fieldName = prompt('Enter field name:');
    const fieldType = prompt('Enter field type (e.g., string, number, ObjectId, Date):');
    if (fieldName && fieldType) {
      setEditedSchema({
        ...editedSchema,
        schema_json: {
          ...editedSchema.schema_json,
          [collectionName]: {
            ...editedSchema.schema_json[collectionName],
            [fieldName]: fieldType
          }
        },
        field_descriptions: {
          ...editedSchema.field_descriptions,
          [collectionName]: {
            ...editedSchema.field_descriptions[collectionName],
            [fieldName]: `Description for ${fieldName}`
          }
        }
      });
    }
  };

  const removeField = (collectionName: string, fieldName: string) => {
    if (confirm(`Remove field "${fieldName}"?`)) {
      const newSchema = { ...editedSchema };
      delete newSchema.schema_json[collectionName][fieldName];
      delete newSchema.field_descriptions[collectionName][fieldName];
      setEditedSchema(newSchema);
    }
  };

  if (!editedSchema) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-500 text-center">No schema loaded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Schema Editor</h2>
            <p className="text-gray-600">Edit your database schema metadata</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Schema
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="schema-upload"
            />
            <label
              htmlFor="schema-upload"
              className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Schema
            </label>
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Schema
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Database: {editedSchema.database}
          </div>
        </div>
      </div>

      {/* Schema Content */}
      <div className="p-6">
        {/* Basic Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
              <input
                type="text"
                value={editedSchema.database || ''}
                onChange={(e) => setEditedSchema({...editedSchema, database: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input
                type="text"
                value={editedSchema.timezone || ''}
                onChange={(e) => setEditedSchema({...editedSchema, timezone: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain Notes</label>
            <textarea
              value={editedSchema.domain_notes || ''}
              onChange={(e) => setEditedSchema({...editedSchema, domain_notes: e.target.value})}
              disabled={!isEditing}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Business logic notes, e.g., 'Revenue = invoices.amount'"
            />
          </div>
        </div>

        {/* Collections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Collections</h3>
            {isEditing && (
              <button
                onClick={addCollection}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Collection
              </button>
            )}
          </div>

          <div className="space-y-4">
            {Object.entries(editedSchema.schema_json || {}).map(([collectionName, fields]: [string, any]) => (
              <div key={collectionName} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveSection(activeSection === collectionName ? null : collectionName)}
                      className="flex items-center text-left"
                    >
                      {activeSection === collectionName ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      <span className="font-medium text-gray-800">{collectionName}</span>
                    </button>
                    {isEditing && (
                      <button
                        onClick={() => removeCollection(collectionName)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {activeSection === collectionName && (
                  <div className="p-4 space-y-4">
                    {/* Collection Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={editedSchema.collection_descriptions?.[collectionName] || ''}
                        onChange={(e) => updateCollectionDescription(collectionName, e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="Collection description"
                      />
                    </div>

                    {/* Fields */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Fields</label>
                        {isEditing && (
                          <button
                            onClick={() => addField(collectionName)}
                            className="flex items-center px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Field
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {Object.entries(fields).map(([fieldName, fieldType]: [string, any]) => (
                          <div key={fieldName} className="flex gap-2 items-center">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={fieldName}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={fieldType}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                              />
                            </div>
                            <div className="flex-2">
                              <input
                                type="text"
                                value={editedSchema.field_descriptions?.[collectionName]?.[fieldName] || ''}
                                onChange={(e) => updateFieldDescription(collectionName, fieldName, e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                placeholder="Field description"
                              />
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => removeField(collectionName, fieldName)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
