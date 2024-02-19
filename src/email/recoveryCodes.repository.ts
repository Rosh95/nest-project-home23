import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RecoveryCodesRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async createDataForRecoveryCode(
    email: string,
    code: string,
  ): Promise<string | boolean> {
    const query = `
    INSERT INTO public."RecoveryCodes"( email, "recoveryCode")
    VALUES ( $1, $2);
    `;
    await this.dataSource.query(query, [email, code]);

    const newInfoAboutRecoveryCode = await this.findDataByRecoveryCode(code);
    if (newInfoAboutRecoveryCode.recoveryCode !== code) {
      return false;
    }
    return newInfoAboutRecoveryCode.recoveryCode;
  }
  async updateDataForRecoveryCode(
    email: string,
    code: string,
  ): Promise<string | boolean> {
    const query = `
    UPDATE public."RecoveryCodes"
    SET "recoveryCode"= $2
    WHERE email = $1;
    `;
    await this.dataSource.query(query, [email, code]);

    const newInfoAboutRecoveryCode = await this.findDataByRecoveryCode(code);
    if (newInfoAboutRecoveryCode.email !== email) {
      return false;
    }
    return newInfoAboutRecoveryCode.recoveryCode;
  }

  // async findUserByCode(
  //   code: string,
  // ): Promise<emailConfirmationDataType | null> {
  //   const query = `
  //   SELECT "userId", "confirmationCode", "emailExpiration", "isConfirmed"
  //   FROM public."EmailConfirmationUser"
  //   where "confirmationCode" =  $1
  //   `;
  //
  //   const userEmailConfirmationData = await this.dataSource.query(query, [
  //     code,
  //   ]);
  //
  //   return userEmailConfirmationData[0] ? userEmailConfirmationData[0] : null;
  // }

  async findDataByRecoveryCode(code: string): Promise<any | null> {
    const query = `
      SELECT id, email, "recoveryCode"
      FROM public."RecoveryCodes"
      WHERE "recoveryCode" = $1
    `;
    const userData = await this.dataSource.query(query, [code]);

    return userData[0] ? userData[0] : null;
  }
}
