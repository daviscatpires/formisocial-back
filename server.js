const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const cors = require('cors');
const app = express();
const port = 5000;
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cors()); // Isso permite o acesso de qualquer origem

// Conexão com o MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.get('/', (req, res) => {
    res.send({ message: 'Dados do servidor recebidos com sucesso!' });
  });

// Definindo o modelo de usuário
const User = mongoose.model('User', {
  fullName: String,
  birthDate: String,
  email: String,
  phoneNumber: String,
  password: String,
  cep: String,
  street: String,
  houseNumber: String,
  complement: String,
  coins: String,
});

app.post('/checkDuplicateData', async (req, res) => {
  const { cpf, email, phoneNumber } = req.body;

  // Verificar duplicatas no banco de dados (exemplo com MongoDB)
  const duplicateCpf = await User.findOne({ cpf });
  const duplicateEmail = await User.findOne({ email });
  const duplicatePhoneNumber = await User.findOne({ phoneNumber });

  const isDuplicate = duplicateCpf || duplicateEmail || duplicatePhoneNumber;

  res.json({ isDuplicate });
});

// Rota de registro
app.post('/register', async (req, res) => {
  try {
    const { fullName, birthDate, email, phoneNumber, password, cep, street, houseNumber, complement } = req.body;
    const coins = 0;  // Inicializando coins com 0

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = new User({ fullName, birthDate, email, phoneNumber, password: hashedPassword, cep, street, houseNumber, complement, coins });
    await user.save();
    res.send({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    console.error('Ocorreu um erro ao registrar o usuário:', error);
    res.status(500).send('Erro interno do servidor ao registrar o usuário.');
  }
});

// Rota de form
app.post('/form', async (req, res) => {
  try {
    const { emailOrPhoneNumber, password } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhoneNumber }, { phoneNumber: emailOrPhoneNumber }] });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    // Se chegou até aqui, o login foi bem-sucedido
    // Criar o token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'chaveSecreta', { expiresIn: '1h' });

    // Enviar o token para o cliente
    res.json({ token, message: 'Login bem-sucedido!' });
  } catch (error) {
    console.error('Ocorreu um erro ao fazer o login:', error);
    res.status(500).send('Erro interno do servidor ao fazer o login.');
  }
});

app.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json({ user: { ...user._doc, coins: user.coins } });
  } catch (error) {
    console.error('Ocorreu um erro ao buscar informações do usuário:', error);
    res.status(500).send('Erro interno do servidor ao buscar informações do usuário.');
  }
});

  

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
