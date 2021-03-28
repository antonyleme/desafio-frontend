import React, { useState, useEffect } from 'react'
import MainLayout from '../layouts/MainLayout'
import { Box, Heading, Flex, Button, Stack, IconButton, Input, useToast, Tooltip, ProgressLabel } from '@chakra-ui/react'
import { BiSearchAlt2 } from 'react-icons/bi'
import { IoAdd } from 'react-icons/io5'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import api from '../services/api'
import { month, week } from '../services/dates'
import { useDispatch, useSelector } from 'react-redux'
import { searchStock } from '../store/modules/wallet/actions'

export default function PriceChart() {
  const wallet = useSelector(state => state.wallet)
  const dispatch = useDispatch()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState()
  const [period, setPeriod] = useState('month')
  const [stocks, setStocks] = useState([])
  const [options, setOptions] = useState({
    title: {
      text: ''
    },
    xAxis: {
      categories: []
    },
    tooltip: {
      valueDecimals: 2,
      valuePrefix: '$',
      valueSuffix: ' USD'
    },
    series: []
  })

  useEffect(() => {
    console.log(wallet)
  }, [wallet])

  function getDates() {
    if (period == 'day')
      return { from: month().firstDay, to: month().lastDay }
    if (period == 'week')
      return { from: week().firstDay, to: week().lastDay }
    return { from: month().firstDay, to: month().lastDay }

  }

  function getStockData(ticker) {
    let dates = getDates()
    return api.get(`/historical-price-full/${ticker}`, {
      params: {
        from: dates.from,
        to: dates.to,
        serietype: 'line'
      }
    });
  }

  const [loadingSet, setLoadingSet] = useState(false)
  async function setChartData(ticker) {
    setLoadingSet(true)
    let result = await getStockData(ticker)
    if (!result.data.historical) {
      toast({
        title: "Oops",
        description: "Não foi possível encontrar o ticker informado",
        status: "error",
        duration: 9000,
        isClosable: true,
      })
    }
    else {
      setStocks([result.data])
      setSearchTerm('')
      dispatch(searchStock(ticker))
    }
    setLoadingSet(false)
  }

  const [loadingAppend, setLoadingAppend] = useState(false)
  async function appendChartData() {
    setLoadingAppend(true)
    let result = await getStockData(searchTerm)
    if (!result.data.historical) {
      toast({
        title: "Oops",
        description: "Não foi possível encontrar o ticker informado",
        status: "error",
        duration: 9000,
        isClosable: true,
      })
    }
    else {
      setStocks([...stocks, result.data])
      setSearchTerm('')
      dispatch(searchStock(searchTerm))
    }
    setLoadingAppend(false)
  }

  useEffect(() => {
    if (stocks.length) {
      let dates = []
      let series = []
      stocks[0].historical.reverse().map(day => {
        dates.push(day.date)
      })

      stocks.map(stock => {
        let values = []
        stock.historical.reverse().map(day => {
          values.push(day.close)
        })
        series.push({ data: values, name: stock.symbol })
      })

      setOptions({
        ...options,
        xAxis: {
          categories: dates,
        },
        series,
      })
    }
  }, [stocks])

  async function updatePeriod() {
    let newStocks = stocks
    for (let i = 0; i < newStocks.length; i++) {
      let result = await getStockData(newStocks[i].symbol)
      newStocks[i] = result.data
    }
    setStocks([...newStocks])
  }

  useEffect(() => {
    updatePeriod()
  }, [period])

  return (
    <Box border="1px" borderColor="gray.200">
      <Box borderBottom="1px" borderBottomColor="gray.200">
        <Flex
          p="10px"
          flexDir={['column', 'row', 'row']}
          alignItems={['flex-start', 'flex-start', 'center']}
          justifyContent={['flex-start', 'flex-start', 'space-between']}
        >
          <Heading
            textTransform="uppercase"
            size="md"
            color="gray.600"
            mb={[2, 2, 0]}
          >
            Gráfico de Preços
          </Heading>

          <Stack direction="row" mb={[2, 2, 0]}>
            <Stack direction="row" position="relative">
              <Input
                type="text"
                borderRadius="0"
                borderWidth="1px"
                pr="40px"
                w={['100%', '250px', '300px']}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    setChartData(e.target.value)
                  }
                }}
              />
              <Tooltip label="Pesquisar">
                <IconButton
                  icon={<BiSearchAlt2 size="20px" color="#4A5568" />}
                  borderRadius="0"
                  bg="transparent"
                  position="absolute"
                  right="0"
                  top="0"
                  bottom="0"
                  onClick={() => setChartData(searchTerm)}
                  isLoading={loadingSet}
                />
              </Tooltip>
            </Stack>
            <Tooltip label="Adicionar">
              <IconButton
                icon={<IoAdd size="20px" color="#4A5568" />}
                borderRadius="0"
                bg="gray.200"
                _hover={{
                  bg: "gray.300"
                }}
                onClick={appendChartData}
                isLoading={loadingAppend}
              />
            </Tooltip>
          </Stack>

          <Stack direction="row">
            <PeriodButton buttonPeriod='day' setPeriod={setPeriod} text='D' label='Dia' />
            <PeriodButton buttonPeriod='week' setPeriod={setPeriod} text='S' label='Semana' />
            <PeriodButton buttonPeriod='month' setPeriod={setPeriod} text='M' label='Month' />
          </Stack>
        </Flex>
      </Box>
      <Box>
        <Box pt="5" w="98%">
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
          />
        </Box>
      </Box>
    </Box>
  )
}

function PeriodButton({ period, setPeriod, buttonPeriod, text, label }) {
  return (
    <Tooltip label={label}>
      <Button borderRadius="0" bg={period == buttonPeriod ? 'gray.400' : 'gray.200'} _hover={{ bg: "gray.300" }} onClick={() => setPeriod(buttonPeriod)}>{text}</Button>
    </Tooltip>
  )
}