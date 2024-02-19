import { CreateUserDto } from '../src/users/user.types';

export const createVasyaDataForRegistAndLogin = (number: number) => {
  const registrationData: CreateUserDto = {
    login: `Vasya${number}`,
    email: `vasya${number}@gmail.ru`,
    password: '123456',
  };
  const loginData = {
    loginOrEmail: `Vasya${number}`,
    password: '123456',
  };

  return { registrationData, loginData };
};
