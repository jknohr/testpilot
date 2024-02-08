import { BaseModel } from './database/models/components/base_models';
import { App } from './database/models/app';
import { Model, PrimaryKey, ForeignKey, Column, Table, Unique, DataType } from 'sequelize-typescript';
import * as path from 'path';
import * as fs from 'fs';

@Table({
  tableName: 'file',
  indexes: [
    {
      unique: true,
      fields: ['appId', 'name', 'path']
    }
  ]
})
class File extends BaseModel {
  @PrimaryKey
  @Column
  id!: number;

  @ForeignKey(() => App)
  @Column
  appId!: number;

  @Column
  name!: string;

  @Column
  path!: string;

  @Column
  full_path!: string;

  @Column(DataType.TEXT)
  description?: string;

  static updatePaths(): void {
    const workspaceDir = path.resolve(__dirname, '../../../../workspace');
    if (!fs.existsSync(workspaceDir)) {
      return;
    }
    File.findAll({
      attributes: ['full_path'],
      group: ['full_path']
    }).then(files => {
      const paths = files.map(file => file.full_path);
      if (!paths.length) {
        return;
      }
      const commonPrefix = path.commonPrefix(paths);
      if (path.commonPrefix([commonPrefix, workspaceDir]) === workspaceDir) {
        return;
      }
      const commonSep = path.sep;
      const commonParts = commonPrefix.split(commonSep);
      const workspaceIndex = commonParts.indexOf('workspace');
      if (workspaceIndex === -1) {
        return;
      }
      const oldPrefix = commonParts.slice(0, workspaceIndex + 1).join(commonSep);
      console.log(`Updating file paths from ${oldPrefix} to ${workspaceDir}`);
      files.forEach(file => {
        if (file.full_path.startsWith(oldPrefix)) {
          const parts = file.full_path.split(commonSep);
          const new_path = path.join(workspaceDir, ...parts.slice(workspaceIndex + 1));
          file.full_path = new_path;
          file.save();
        }
      });
    });
  }
}
