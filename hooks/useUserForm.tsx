import { useState } from 'react';

interface InitialValues {
  firstName?: string;
  lastName?: string;
  username?: string;
  usernameNumber?: string;
  numberError?: string;
  emailAddress?: string;
  password?: string;
}

const defaultValues: InitialValues = {
  firstName: '',
  lastName: '',
  username: '',
  usernameNumber: '',
  numberError: '',
  emailAddress: '',
  password: '',
};

const useUserForm = (initialValues = defaultValues) => {
  const [firstName, setFirstName] = useState(initialValues.firstName || '');
  const [lastName, setLastName] = useState(initialValues.lastName || '');
  const [username, setUsername] = useState(initialValues.username || '');
  const [usernameNumber, setUsernameNumber] = useState(
    initialValues.usernameNumber || ''
  );
  const [numberError, setNumberError] = useState(
    initialValues.numberError || ''
  );
  const [emailAddress, setEmailAddress] = useState(
    initialValues.emailAddress || ''
  );
  const [password, setPassword] = useState(initialValues.password || '');

  const onChangeUsername = (text: string) => {
    setUsername(text);
    if (!usernameNumber) {
      const randomNumber = String(Math.floor(Math.random() * 99) + 1).padStart(
        2,
        '0'
      );
      setUsernameNumber(randomNumber);
      setNumberError('');
    }
  };

  const onChangeNumber = (number: string) => {
    if (number === '00') return;
    setUsernameNumber(number);

    const isNumber = /^\d+$/.test(number);
    const isValid = isNumber && number.length === 2;

    if (!isValid) {
      setNumberError('Invalid username, enter a minimum of 2 digits');
    } else {
      setNumberError('');
    }
  };

  const onChangeFirstName = (text: string) => {
    setFirstName(text);
  };

  const onChangeLastName = (text: string) => {
    setLastName(text);
  };

  const onChangeEmailAddress = (text: string) => {
    setEmailAddress(text);
  };

  const onChangePassword = (text: string) => {
    setPassword(text);
  };

  return {
    firstName,
    lastName,
    username,
    usernameNumber,
    numberError,
    emailAddress,
    password,
    onChangeNumber,
    onChangeUsername,
    onChangeFirstName,
    onChangeLastName,
    onChangeEmailAddress,
    onChangePassword,
  };
};

export default useUserForm;
